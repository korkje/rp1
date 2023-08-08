import { assertEquals } from "./deps.ts";
import Router from "../lib/router.ts";
import ServerError from "../lib/error.ts";

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
        throw new ServerError({ status: 500, message: "Test" });
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

Deno.serve({ port: 9001 }, router.handle);

Deno.test("Middleware ordering", async () => {
    let called = false;
    router.get("/", () => called = true);

    const res = await fetch("http://localhost:9001");
    await res.body?.cancel();

    assertEquals(called, true);

    const test = res.headers.get("X-Test");
    assertEquals(test, "1, 2, 3, 4, 5, 6");
});

Deno.test("Middleware skip", async () => {
    let called = false;
    router.get("/skip", () => called = true);

    const res = await fetch("http://localhost:9001/skip");
    await res.body?.cancel();

    assertEquals(called, false);

    const test = res.headers.get("X-Test");
    assertEquals(test, "1, 2, 5, 6");
});

Deno.test("Middleware error", async () => {
    let called = false;
    router.get("/throw", () => called = true);

    const res = await fetch("http://localhost:9001/throw");
    await res.body?.cancel();

    assertEquals(called, false);

    assertEquals(res.status, 500);

    const test = res.headers.get("X-Test");
    assertEquals(test, null);
});
