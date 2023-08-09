import { assertEquals } from "./deps.ts";
import Router from "../lib/router.ts";
import error, { ServerError } from "../lib/error.ts";

const router = new Router();

router.get("/native", () => {
    throw new Error();
});

router.get("/custom", () => {
    throw error(402, "Pay up!");
});

router.get("/stack", () => {
    throw new ServerError(500, "Stack included", true);
});

Deno.serve(router.handle);

Deno.test("Regular Error leads to 500", async () => {
    const res = await fetch("http://localhost:8000/native");
    assertEquals(res.status, 500);

    const body = await res.json();
    assertEquals(body.message, "Internal Server Error");

    const hasStack = body.stack !== undefined;
    assertEquals(hasStack, false);
});

Deno.test("ServerError is correctly serialized", async () => {
    const res = await fetch("http://localhost:8000/custom");
    assertEquals(res.status, 402);

    const body = await res.json();
    assertEquals(body.message, "Pay up!");

    const hasStack = body.stack !== undefined;
    assertEquals(hasStack, false);
});

Deno.test("Stack is included", async () => {
    const res = await fetch("http://localhost:8000/stack");
    assertEquals(res.status, 500);

    const body = await res.json();
    assertEquals(body.message, "Stack included");

    const hasStack = body.stack !== undefined;
    assertEquals(hasStack, true);
});
