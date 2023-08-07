# rp1
Blazingly fast and simple web framework for Deno, suitably named after the [rocket fuel](https://en.wikipedia.org/wiki/RP-1).

```ts
import Router from "https://deno.land/x/rp1/mod.ts";

const router = new Router();

router.get("/", () => "Hello World!");

Deno.serve(router.handle);
```

## Features

Generates JSON if you return an object.

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

Sane error handling.

```ts
import { ServerError } from "https://deno.land/x/rp1/mod.ts";

// '{ "error": { "status": 402, "message": "Expected dollars!" } }'
router.post("/paypal", () => {
    throw new ServerError({
        status: 402,
        message: "Expected dollars!"
    });
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
import { cors } from "https://deno.land/x/rp1/mod.ts";

router.use(cors());
```

Configure CORS easily.

```ts
import { cors, echo } from "https://deno.land/x/rp1/mod.ts";

router.use(cors({
    origin: echo,
    methods: ["GET", "POST"],
    headers: ["Content-Type"],
}));
```

Uses native `Request` object, so WebSockets are supported.

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
