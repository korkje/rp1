import Router from "../router.ts";
import { ServerError } from "../error.ts";
import { assertEquals } from "https://deno.land/std@0.197.0/testing/asserts.ts";

const router = new Router();

router.get("/native", () => {
    throw new Error();
});

router.get("/custom", () => {
    throw new ServerError({ message: "Pay up!", status: 402 });
});

Deno.serve({ port: 9001, handler: router.handle });

Deno.test("Regular Error leads to 500", async () => {
    const res = await fetch("http://localhost:9001/native");
    assertEquals(res.status, 500);

    const body = await res.json();
    assertEquals(body.error.message, "Internal Server Error");
});

Deno.test("Custom is correctly serialized", async () => {
    const res = await fetch("http://localhost:9001/custom");
    assertEquals(res.status, 402);

    const body = await res.json();
    assertEquals(body.error.message, "Pay up!");
});
