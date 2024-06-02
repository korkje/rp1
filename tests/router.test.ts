import { assertEquals } from "@std/assert";

import Router from "../lib/router.ts";

const router = new Router();

router
    .get("/", () => {})
    .get("/json", () => ({ hello: "world" }))
    .get("/params/:a/:b", ({ params }) => params)
    .get("/wc/:param/*", ({ params }) => params);

router.sub("/sub")
    .get("/hello", () => "hello")
    .get("/*?", ({ params }) => params);

router.sub("/sub2/:param")
    .get("/:param2", ({ params }) => params);

router.sub("/sub3").sub("/sub4")
    .get("/hello", () => "hello");

Deno.test("Simple empty response", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000");
    const body = await res.text();

    assertEquals(body, "");
    assertEquals(res.status, 204);
});

Deno.test("Simple JSON response", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/json");
    const body = await res.json();

    assertEquals(body, { hello: "world" });
    assertEquals(res.status, 200);
});

Deno.test("Parameters parsed correctly", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/params/1/2");
    const body = await res.json();

    assertEquals(body, { a: "1", b: "2" });
    assertEquals(res.status, 200);
});

Deno.test("Wildcard path with parameter", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/wc/1/2/3");
    const body = await res.json();

    assertEquals(body, { param: "1", 0: "2/3" });
    assertEquals(res.status, 200);
});

Deno.test("Only match if method matches", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/params/1/2", { method: "POST" });
    const body = await res.text();

    assertEquals(body, "");
    assertEquals(res.status, 404);
});

Deno.test("Subrouter", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/sub/hello");
    const body = await res.json();

    assertEquals(body, "hello");
    assertEquals(res.status, 200);
});

Deno.test("Subrouter wildcard", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/sub/hello/world");
    const body = await res.json();

    assertEquals(body, { 0: "hello/world" });
    assertEquals(res.status, 200);

    const res2 = await fetch("http://localhost:8000/sub");
    const body2 = await res2.json();

    assertEquals(body2, { 0: "" });
    assertEquals(res2.status, 200);
});

Deno.test("Subrouter parameters", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/sub2/1/2");
    const body = await res.json();

    assertEquals(body, { param: "1", param2: "2" });
    assertEquals(res.status, 200);
});

Deno.test("Sub-subrouter", async () => {
    await using _ = Deno.serve(router.handle);

    const res = await fetch("http://localhost:8000/sub3/sub4/hello");
    const body = await res.json();

    assertEquals(body, "hello");
    assertEquals(res.status, 200);
});
