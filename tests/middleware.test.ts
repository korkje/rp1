import { assertEquals } from "./deps.ts";
import Router from "../lib/router.ts";
import error from "../lib/error.ts";

const router = new Router();

router.use(async ({ response }, next) => {
    response.headers.append("X-Test", "1");
    await next();
    response.headers.append("X-Test", "6");
});

router.use(async ({ request, response }, next) => {
    response.headers.append("X-Test", "2");
    const url = new URL(request.url);

    if (url.pathname === "/throw") {
        throw error(500, "Test");
    }
    else if (url.pathname !== "/skip") {
        await next();
    }

    response.headers.append("X-Test", "5");
});

router.use(async ({ response }, next) => {
    response.headers.append("X-Test", "3");
    await next();
    response.headers.append("X-Test", "4");
});

Deno.serve(router.handle);

Deno.test("Middleware ordering", async () => {
    let called = false;
    router.get("/", () => called = true);

    const res = await fetch("http://localhost:8000");
    await res.body?.cancel();

    assertEquals(called, true);

    const test = res.headers.get("X-Test");
    assertEquals(test, "1, 2, 3, 4, 5, 6");
});

Deno.test("Middleware skip", async () => {
    let called = false;
    router.get("/skip", () => called = true);

    const res = await fetch("http://localhost:8000/skip");
    await res.body?.cancel();

    assertEquals(called, false);

    const test = res.headers.get("X-Test");
    assertEquals(test, "1, 2, 5, 6");
});

Deno.test("Middleware error", async () => {
    let called = false;
    router.get("/throw", () => called = true);

    const res = await fetch("http://localhost:8000/throw");
    await res.body?.cancel();

    assertEquals(called, false);

    assertEquals(res.status, 500);

    const test = res.headers.get("X-Test");
    assertEquals(test, null);
});

Deno.test("Handler result propagates", async () => {
    router.get("/result", ({ response }) => {
        response.headers.append("X-Test", "result");
        return "result";
    });

    const res = await fetch("http://localhost:8000/result");

    assertEquals(await res.json(), "result");

    const test = res.headers.get("X-Test");
    assertEquals(test, "1, 2, 3, result, 4, 5, 6");
});
