import Context from "./context.ts";
import { GenericHandler } from "./router.ts";

export type Middleware = (context: Context<string>, next: () => Promise<void>) => Promise<void>;
export type Runner = (context: Context<string>, handler: GenericHandler) => ReturnType<GenericHandler>;

export const echo = Symbol("echo");

export type CORSInit = {
    origin?: string | typeof echo;
    methods?: string[] | typeof echo;
    headers?: string[] | typeof echo;
    maxAge?: number;
};

export const cors = ({
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    headers = echo,
    maxAge = 86400,
}: CORSInit = {}): Middleware => async ({ request, response }, next) => {

    const _origin = origin === echo
        ? request.headers.get("Origin")
        : origin;

    if (_origin) {
        response.headers.set("Access-Control-Allow-Origin", _origin);
    }

    const _methods = methods === echo
        ? request.headers.get("Access-Control-Request-Method")
        : methods.join(", ");

    if (_methods) {
        response.headers.set("Access-Control-Allow-Methods", _methods);
    }

    const _headers = headers === echo
        ? request.headers.get("Access-Control-Request-Headers")
        : headers.join(", ");

    if (_headers) {
        response.headers.set("Access-Control-Allow-Headers", _headers);
    }

    if (request.method === "OPTIONS") {
        response.headers.set("Access-Control-Max-Age", String(maxAge));
        return;
    }

    await next();
};
