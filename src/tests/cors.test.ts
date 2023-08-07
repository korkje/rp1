import { assertEquals } from "https://deno.land/std@0.197.0/testing/asserts.ts";

import { cors, echo } from "../middleware.ts";
import Router from "../router.ts";

const router = new Router();

router.use(cors({ origin: echo }));

router.get("/", () => {});

Deno.serve({ port: 9001, handler: router.handle });

Deno.test("Headers are set correctly", async () => {
    const res = await fetch("http://localhost:9001", {
        headers: {
            "Origin": "localhost:9001",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    });

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "localhost:9001");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), "Content-Type");
});

Deno.test("Headers not set on echo when omitted from request", async () => {
    const res = await fetch("http://localhost:9001");

    assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
});
