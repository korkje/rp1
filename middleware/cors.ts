import { Middleware } from "../lib/router.ts";
import { Skip, noSkip } from "./skip.ts";

export const echo = Symbol("echo");
export type Echo = typeof echo;

export const isEcho = (value: unknown): value is Echo => value === echo;
export const array = (value: string | string[]): string[] => Array.isArray(value) ? value : [value];

export const enum Header {
    Vary = "Vary",
    Origin = "Origin",
    AccessControlRequestMethod = "Access-Control-Request-Method",
    AccessControlRequestHeaders = "Access-Control-Request-Headers",
    AccessControlAllowOrigin = "Access-Control-Allow-Origin",
    AccessControlAllowMethods = "Access-Control-Allow-Methods",
    AccessControlAllowHeaders = "Access-Control-Allow-Headers",
    AccessControlAllowCredentials = "Access-Control-Allow-Credentials",
    AccessControlExposeHeaders = "Access-Control-Expose-Headers",
    AccessControlMaxAge = "Access-Control-Max-Age",
}

export type CORSOptions = {
    skip?: Skip;
    origins?: Echo | string | string[];
    methods?: Echo | string | string[];
    headers?: Echo | string | string[];
    credentials?: true;
    expose?: string | string[];
    maxAge?: number;
};

export const cors = ({
    skip = noSkip,
    origins = "*",
    methods = echo,
    headers = echo,
    credentials,
    expose,
    maxAge = 86400,
}: CORSOptions = {}): Middleware => async (context, next) => {

    if (await skip(context)) {
        return next();
    }

    const { request, response } = context;

    const requestOrigin = request.headers.get(Header.Origin);
    let _origin: string | undefined = undefined;

    if (isEcho(origins)) {
        _origin = requestOrigin ?? "*";
    }
    else {
        for (const candidate in array(origins)) {
            if (candidate === "*" && credentials) {
                _origin = requestOrigin ?? "*";
                break;
            }
            else if (candidate === "*" || candidate === requestOrigin) {
                _origin = candidate;
                break;
            }
            else if (requestOrigin && requestOrigin.startsWith(candidate)) {
                _origin = requestOrigin;
                break;
            }
        }
    }

    if (_origin) {
        response.headers.set("Access-Control-Allow-Origin", _origin);
    }

    response.headers.append(Header.Vary, Header.Origin);

    if (credentials) {
        response.headers.set(Header.AccessControlAllowCredentials, "true");
    }

    if (request.method !== "OPTIONS") {
        if (expose) {
            response.headers.set(Header.AccessControlExposeHeaders, array(expose).join(", "));
        }

        return await next();
    }

    response.headers.append(Header.Vary, Header.AccessControlRequestMethod);
    response.headers.append(Header.Vary, Header.AccessControlRequestHeaders);

    const requestMethod = request.headers.get(Header.AccessControlRequestMethod);
    let _method: string | undefined = undefined;

    if (isEcho(methods)) {
        _method = requestMethod ?? undefined;
    }
    else {
        _method = array(methods).join(", ");
    }

    if (_method) {
        response.headers.set(Header.AccessControlAllowMethods, _method);
    }

    const requestHeaders = request.headers.get(Header.AccessControlRequestHeaders);
    let _headers: string | undefined = undefined;

    if (isEcho(headers)) {
        _headers = requestHeaders ?? undefined;
    }
    else {
        _headers = array(headers).join(", ");
    }

    if (_headers) {
        response.headers.set(Header.AccessControlAllowHeaders, _headers);
    }

    response.headers.set(Header.AccessControlMaxAge, maxAge.toString());
};

export default cors;
