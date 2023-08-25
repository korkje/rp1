import { assertEquals } from "./deps.ts";

import Router from "../lib/router.ts";

const router = new Router();

router
    .get("/", () => {})
    .get("/json", () => ({ hello: "world" }))
    .get("/params/:a/:b", ({ params }) => params)
    .get("/wc/:param/*", ({ params }) => params);

Deno.serve(router.handle);

Deno.test("Simple empty response", async () => {
    const res = await fetch("http://localhost:8000");
    const body = await res.text();

    assertEquals(body, "");
    assertEquals(res.status, 204);
});

Deno.test("Simple JSON response", async () => {
    const res = await fetch("http://localhost:8000/json");
    const body = await res.json();

    assertEquals(body, { hello: "world" });
    assertEquals(res.status, 200);
});

Deno.test("Parameters parsed correctly", async () => {
    const res = await fetch("http://localhost:8000/params/1/2");
    const body = await res.json();

    assertEquals(body, { a: "1", b: "2" });
    assertEquals(res.status, 200);
});

Deno.test("Wildcard path with parameter", async () => {
    const res = await fetch("http://localhost:8000/wc/1/2/3");
    const body = await res.json();

    assertEquals(body, { param: "1", 0: "2/3" });
    assertEquals(res.status, 200);
});

Deno.test("Only match if method matches", async () => {
    const res = await fetch("http://localhost:8000/params/1/2", { method: "POST" });
    const body = await res.text();

    assertEquals(body, "");
    assertEquals(res.status, 404);
});
