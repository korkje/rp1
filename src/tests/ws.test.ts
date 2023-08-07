import { assertEquals } from "https://deno.land/std@0.197.0/testing/asserts.ts";

import Router from "../router.ts";

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

Deno.serve({ port: 9001, handler: router.handle });

Deno.test("WebSocket", async () => {
    const ws = new WebSocket("ws://localhost:9001/ws");

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

    assertEquals(count, 10);
});
