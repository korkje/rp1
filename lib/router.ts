import Context from "./context.ts";
import { ServerError } from "./error.ts";

export type Handler<Path extends string = string> = (context: Context<Path>) => unknown | Promise<unknown>;
export type Middleware = (context: Context, next: () => Promise<unknown>) => unknown | Promise<unknown>;
export type Runner = (context: Context, handler: Handler) => ReturnType<Handler>;

export const methods = ["get", "post", "put", "delete", "patch", "head", "options"] as const;
export const notFound: Handler = () => new Response(null, { status: 404 });

export type MethodParams<Path extends `/${string}`> = [path: Path, handler: Handler<Path>];

export interface Router {
    get<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    post<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    put<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    delete<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    patch<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    head<Path extends `/${string}`>(...params: MethodParams<Path>): this;
    options<Path extends `/${string}`>(...params: MethodParams<Path>): this;
}

export class Router {
    private cache = new Map<string, [Handler, object] | undefined>;
    private routes = new Map<string, Handler>();
    private patterns: URLPattern[] = [];
    private middlewares: Middleware[] = [];
    private runner?: Runner = undefined;

    constructor() {
        this.handle = this.handle.bind(this);

        for (const method of methods) {
            this[method] = (path, handler) => this.add(method, path, handler);
        }
    }

    private compose(): Runner {
        if (this.middlewares.length === 0) {
            return async (context, handler) => await handler(context);
        }

        return async (context, handler) => {
            let i = 0;
            let result: unknown;

            const next = async () => {
                const middleware = this.middlewares[i++];

                if (middleware) {
                    await middleware(context, next);
                }
                else {
                    result = await handler(context);
                }

                return result;
            };

            return await next();
        };
    }

    private add(
        method: string,
        path: string,
        handler: Handler,
    ) {
        const key = `${method} ${path}`;
        this.routes.set(key, handler);

        const dynamic = path.includes(":") || path.includes("*");

        if (!dynamic) {
            this.cache.set(key, [handler, {}]);
        }

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

        return [handler, params] as const;
    }

    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
        this.runner = undefined;

        return this;
    }

    public async handle(request: Request, info: Deno.ServeHandlerInfo) {
        const { pathname } = new URL(request.url);
        const method = request.method.toLowerCase();
        const [handler, params] = this.match(method, pathname as `/${string}`) ?? [notFound, {}];

        const context = new Context(params, request, info);

        try {
            this.runner ??= this.compose();
            const result = await this.runner(context, handler);

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
            if (error instanceof ServerError) {
                console.error(error.stack);
                return error.response();
            }

            console.error(error);
            return new ServerError().response();
        }
    }
}

export default Router;
