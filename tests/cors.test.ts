import { assertEquals } from "./deps.ts";
import cors, { echo } from "../middleware/cors.ts";
import Router from "../lib/router.ts";

const router = new Router();

router.use(cors({ origins: echo, expose: "Content-Type" }));

router.post("/post", () => {});

Deno.serve({ port: 9001 }, router.handle);

Deno.test("Headers set correctly for OPTIONS request", async () => {
    const res = await fetch("http://localhost:9001/post", {
        method: "OPTIONS",
        headers: {
            "Origin": "localhost:9001",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    });

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "localhost:9001");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), "Content-Type");
    assertEquals(res.headers.get("Access-Control-Expose-Headers"), null);
});

Deno.test("Headers set correctly for POST request", async () => {
    const res = await fetch("http://localhost:9001/post", {
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
    const res = await fetch("http://localhost:9001");

    res.body?.cancel();

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
});
