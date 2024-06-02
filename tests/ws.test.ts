import { assertEquals } from "@std/assert";

import Router from "../lib/router.ts";

const router = new Router();

router.get("/ws", ({ request }) => {
    const { socket, response } = Deno.upgradeWebSocket(request);

    socket.onopen = () => {
        socket.send("Hello World!");
    };

    socket.onmessage = ({ data }) => {
        socket.send(data);
    };

    return response;
});

Deno.test("WebSocket", async () => {
    await using _ = Deno.serve(router.handle);

    const ws = new WebSocket("ws://localhost:8000/ws");

    const openPromise = new Promise(resolve => {
        ws.addEventListener("open", resolve);
    });

    const messagePromise = new Promise<void>(resolve => {
        const listener = ({ data }: MessageEvent) => {
            assertEquals(data, "Hello World!");
            ws.removeEventListener("message", listener);
            resolve();
        };

        ws.addEventListener("message", listener);
    });

    await Promise.all([openPromise, messagePromise]);

    let count = 0;

    const echoPromise = new Promise<void>(resolve => {
        const listener = ({ data }: MessageEvent) => {
            ++count;
            assertEquals(data, "echo");

            if (count === 10) {
                ws.removeEventListener("message", listener);
                return resolve();
            }

            ws.send("echo");
        };

        ws.addEventListener("message", listener);
    });

    ws.send("echo");

    await echoPromise;

    ws.close();

    await new Promise(resolve => setTimeout(resolve, 10));

    assertEquals(count, 10);
});
