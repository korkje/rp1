import Context from "./context.ts";
import { ServerError } from "./error.ts";
import { Middleware, Runner } from "./middleware.ts";

// deno-lint-ignore no-explicit-any
export type Handler<Path extends string> = (context: Context<Path>) => any | Promise<any>;
export type GenericHandler = Handler<string>;

export interface Router {
    get<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    post<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    put<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    delete<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    patch<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    head<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
    options<Path extends `/${string}`>(path: Path, handler: Handler<Path>): this;
}

export const methods = ["get", "post", "put", "delete", "patch", "head", "options"] as const;

export class Router {
    private cache = new Map<string, [GenericHandler, object] | undefined>;
    private routes = new Map<string, GenericHandler>();
    private patterns: URLPattern[] = [];
    private middlewares: Middleware[] = [];
    private runner: Runner | undefined = undefined;

    constructor() {
        this.handle = this.handle.bind(this);

        for (const method of methods) {
            // @ts-ignore: shoe-horns convenience methods into App
            this[method] = (path, handler) => this.add(method, path, handler);
        }
    }

    private compose() {
        if (this.runner) {
            return this.runner;
        }

        if (this.middlewares.length === 0) {
            return this.runner = async (context, handler) => await handler(context);
        }

        return this.runner = async (context, handler) => {
            let i = 0;
            let result;

            const next = async () => {
                const middleware = this.middlewares[i++];

                if (middleware) {
                    await middleware(context, next);
                }
                else {
                    result = await handler(context);
                }
            };

            await next();

            return result;
        }
    }

    private add<Path extends `/${string}`>(
        method: typeof methods[number],
        path: Path,
        handler: Handler<Path>
    ) {
        const key = `${method} ${path}`;
        this.routes.set(key, handler as GenericHandler);

        const pattern = new URLPattern({ pathname: path });
        const exists = this.patterns.some(p => p.pathname === pattern.pathname);

        if (!exists) {
            this.patterns.push(pattern);
        }

        return this;
    }

    private match(method: string, path: `/${string}`) {
        const cid = `${method} ${path}`;

        if (this.cache.has(cid)) {
            return this.cache.get(cid);
        }

        const pattern = this.patterns.find(p => p.test({ pathname: path }));

        if (!pattern) {
            this.cache.set(cid, undefined);
            return undefined;
        }

        const { pathname } = pattern;
        const key = `${method} ${pathname}`;

        const handler = this.routes.get(key);

        if (!handler) {
            this.cache.set(cid, undefined);
            return undefined;
        }

        const params = pattern.exec({ pathname: path })?.pathname.groups ?? {};
        this.cache.set(cid, [handler, params]);

        return [handler, params] as const;
    }

    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
        this.runner = undefined;

        return this;
    }

    public async handle(request: Request) {
        const { pathname } = new URL(request.url);
        const method = request.method.toLowerCase();
        const match = this.match(method, pathname as `/${string}`);

        if (!match) {
            return new Response("Not Found", { status: 404 });
        }

        const [handler, params] = match;
        const context = new Context(params, request);

        try {
            const runner = this.compose();
            const result = await runner(context, handler);

            if (result === undefined) {
                return context.response;
            }
            else if (result instanceof Response) {
                const { status, headers, body } = result;

                if (status === 101) {
                    return result;
                }

                for (const [key, value] of headers.entries()) {
                    context.response.headers.set(key, value);
                }

                return new Response(body, { status, headers: context.response.headers });
            }
            else if (result instanceof ServerError) {
                return result.response();
            }

            const { headers } = context.response;
            const status = context.response.status === 204 ? 200 : context.response.status;
            return Response.json(result, { status, headers });
        }
        catch (error) {
            console.error(error);

            if (error instanceof ServerError) {
                return error.response();
            }

            const serverError = new ServerError({
                status: 500,
                message: "Internal Server Error",
            });

            return serverError.response();
        }
    }
}

export default Router;
