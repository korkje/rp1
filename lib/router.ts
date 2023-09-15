import Context from "./context.ts";
import { ServerError } from "./error.ts";

export type Handler<Path extends string = string> =
    (context: Context<Path>) => unknown | Promise<unknown>;
export type Middleware<Path extends string = string> =
    (context: Context<Path>, next: () => Promise<unknown>) => unknown | Promise<unknown>;
export type Runner =
    (context: Context, handler: Handler) => ReturnType<Handler>;

export const methods = ["get", "post", "put", "delete", "patch", "head", "options", "connect", "trace"] as const;
export const notFound: Handler = () => new Response(null, { status: 404 });

export type Route = <Path extends `/${string}`>
    (path: Path, handler: Handler<`${Path}`>, middlewares?: Middleware<`${Path}`>[]) => Router;
export type RouterMethods = { [Method in typeof methods[number]]: Route };
// deno-lint-ignore no-empty-interface
export interface Router extends RouterMethods {}

export type SubRoute<Root extends string> = <Path extends `/${string}`>
    (path: Path, handler: Handler<`${Root}${Path}`>, middlewares?: Middleware<`${Root}${Path}`>[]) => SubRouter<Root>;
export type SubRouterMethods<Root extends string> = { [Method in typeof methods[number]]: SubRoute<Root> };
export interface SubRouter<Root extends string> extends SubRouterMethods<Root> {
    use(middleware: Middleware<Root>): SubRouter<Root>;
    sub<SubRoot extends `/${string}`>(root: SubRoot): SubRouter<`${Root}${SubRoot}`>;
}

export function composeRunner(middlewares: Middleware[]): Runner {
    return async (context, handler) => {
        let i = 0;
        let result: unknown;

        const next = async () => {
            const middleware = middlewares[i++];

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

export function composeHandler(handler: Handler, middlewares?: Middleware[]): Handler {
    if (middlewares === undefined) {
        return handler;
    }

    const runner = composeRunner(middlewares);

    return async context => await runner(context, handler);
}

export class Router {
    private static: Record<string, Handler | undefined> = {};
    private dynamic: Record<string, [URLPattern, Handler][] | undefined> = {};
    private middlewares: Middleware[] = [];
    private runner?: Runner = undefined;

    constructor() {
        this.handle = this.handle.bind(this);

        for (const method of methods) {
            this[method] = this.add(method);
            this.dynamic[method] = [];
        }
    }

    private add(method: string) {
        return (pathname: string, handler: Handler, middlewares?: Middleware[]) => {
            handler = composeHandler(handler, middlewares);

            if (pathname.includes(":") || pathname.includes("*")) {
                this.dynamic[method]?.push([new URLPattern({ pathname }), handler]);
            }
            else {
                this.static[`${method} ${pathname}`] = handler;
            }

            return this;
        };
    }

    private match(method: string, pathname: `/${string}`) {
        const key = `${method} ${pathname}`;
        if (key in this.static) {
            return [this.static[key]!, {}] as const;
        }

        const route = this.dynamic[method]?.find(([p]) => p.test({ pathname }));
        if (!route) {
            return undefined;
        }

        const [pattern, handler] = route;
        return [handler, pattern.exec({ pathname })?.pathname.groups ?? {}] as const;
    }

    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
        this.runner = undefined;

        return this;
    }

    public sub<Root extends `/${string}`>(root: Root) {
        const subRouter = {} as SubRouter<Root>;
        const subMiddlewares: Middleware<Root>[] = [];

        for (const method of methods) {
            subRouter[method] = (path, handler, middlewares) => {
                handler = composeHandler(handler, subMiddlewares);
                this.add(method)(`${root}${path}`, handler, middlewares);
                return subRouter;
            }
        }

        subRouter.use = middleware => {
            subMiddlewares.push(middleware);
            return subRouter;
        };

        // @ts-ignore: `${Root}${SubRoot}` _is_ assignable to `/${string}`
        subRouter.sub = subRoot => this.sub(`${root}${subRoot}`);

        return subRouter;
    }

    public async handle(request: Request, info: Deno.ServeHandlerInfo) {
        try {
            const { pathname } = new URL(request.url);
            const method = request.method.toLowerCase();
            const [handler, params] = this.match(method, pathname as `/${string}`) ?? [notFound, {}];

            const context = new Context(params, request, info);

            this.runner ??= composeRunner(this.middlewares);
            const result = await this.runner(context, handler);

            if (result === undefined) {
                return context.response;
            }
            else if (result instanceof Response) {
                if (result.status === 101) {
                    return result;
                }

                for (const [key, value] of context.response.headers.entries()) {
                    result.headers.append(key, value);
                }

                return result;
            }
            else if (result instanceof ServerError) {
                return result.response();
            }

            return Response.json(result, { headers: context.response.headers });
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
