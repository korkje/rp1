# rp1 🚀
Blazingly fast and simple web framework for Deno, suitably named after the [rocket fuel](https://en.wikipedia.org/wiki/RP-1).

```ts
import Router from "https://deno.land/x/rp1/mod.ts";

const router = new Router();

router.get("/", () => "Hello World!");

Deno.serve(router.handle);
```

## Features

Generates JSON for [serializable](https://www.json.org/json-en.html) values.

```ts
// '{ "data": [1, 2, 3] }' with a 200 status code
router.get("/json", () => { data: [1, 2, 3] });
```

Infers parameters from the path.

```ts
// 'params' is of type { id: string }
router.get("/users/:id", ({ params }) => {
    const id = params.id;
    // ...
});
```

Sane error handling. Thrown errors are logged (`console.error`), returned errors are not. Both get serialized to JSON. Optionally include stack trace.

```ts
import { error } from "https://deno.land/x/rp1/mod.ts";

// '{ "status": 418, "message": "I'm a teapot" }'
router.get("/coffee", () => {
    throw error(418, "I'm a teapot");
    // ^ Logged
});

// '{ "status": 402, "message": "Missing $$$", "stack": "..." }'
router.post("/cash", () => {
    return error(402, "Missing $$$").expose();
    // ^ Not logged                    ^ Include stack trace
});
```

You can return `Response` objects.

```ts
// 'Hello World!'
router.get("/hello", () => new Response("Hello World!"));
```

Easy to use middleware.

```ts
// Simple request logger
router.use(async ({ request }, next) => {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`${method} ${path}`);

    await next();
});
```

CORS middleware included.

```ts
import cors from "https://deno.land/x/rp1/middleware/cors.ts";

router.use(cors());
```

...which is easily configurable.

```ts
import cors, { echo } from "https://deno.land/x/rp1/middleware/cors.ts";

router.use(cors({
    // Skip CORS for public paths
    skip: ({ request }) => {
        const url = new URL(request.url);
        return url.pathname.startsWith("/public/");
    }, 
    origin: echo,
    methods: ["GET", "POST"],
    headers: "Content-Type",
    // ...
}));
```

Uses native `Request` object, so WebSockets are supported out of the box.

```ts
router.get("/ws", ({ request }) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    
    socket.onopen = () => {
        console.log("Socket opened!");
    };

    // ...

    return response;
});
```
