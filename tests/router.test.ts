import { assertEquals } from "./deps.ts";

import Router from "../lib/router.ts";

const router = new Router();

router
    .get("/", () => {})
    .get("/json", () => ({ hello: "world" }))
    .get("/params/:a/:b", ({ params }) => params);

Deno.serve({ port: 9001 }, router.handle);

Deno.test("Simple empty response", async () => {
    const res = await fetch("http://localhost:9001");
    const body = await res.text();

    assertEquals(body, "");
    assertEquals(res.status, 204);
});

Deno.test("Simple JSON response", async () => {
    const res = await fetch("http://localhost:9001/json");
    const body = await res.json();

    assertEquals(body, { hello: "world" });
    assertEquals(res.status, 200);
});

Deno.test("Parameters parsed correctly", async () => {
    const res = await fetch("http://localhost:9001/params/1/2");
    const body = await res.json();

    assertEquals(body, { a: "1", b: "2" });
    assertEquals(res.status, 200);
});
