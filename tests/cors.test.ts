import { assertEquals } from "@std/assert";
import cors, { echo } from "middleware/cors.ts";
import Router from "lib/router.ts";
import { error } from "lib/error.ts";

const router = new Router();

router.use(cors({ origins: echo, expose: "Content-Type" }));

router.post("/post", () => {});
router.get("/get_error", () => error(404, "Not found"));

Deno.test("Headers set correctly for OPTIONS request", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/post", {
        method: "OPTIONS",
        headers: {
            "Origin": "localhost:8000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    });

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "localhost:8000");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), "Content-Type");
    assertEquals(res.headers.get("Access-Control-Expose-Headers"), null);
});

Deno.test("Headers set correctly for POST request", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/post", {
        method: "POST",
        headers: {
            "Access-Control-Request-Headers": "Content-Type",
            "Access-Control-Expose-Headers": "Content-Type",
        },
    });

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
    assertEquals(res.headers.get("Access-Control-Expose-Headers"), "Content-Type");
});

Deno.test("Correct behaviour for non-existent routes", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000");

    res.body?.cancel();

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
});

Deno.test("CORS works on errors", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/get_error");

    res.body?.cancel();

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
});
