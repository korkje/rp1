import { ServerError, ServerErrorParams } from "./error.ts";

type Increment<N extends unknown[]> = [unknown, ...N];
type Size<T extends unknown[]> = T['length'];

export type ExtractParams<Path extends string> =
    Path extends `${infer _}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : Path extends `${infer _}:${infer Param}` ? Param : never;

export type ExtractWildcards<Path extends string, Counter extends unknown[] = []> =
    Path extends `${infer _}*${infer Rest}`
    ? Size<Counter> | ExtractWildcards<Rest, Increment<Counter>>
    : never;

export class Context<Path extends string = string> {
    public response: Response;

    constructor(
        public params: Record<ExtractParams<Path> | ExtractWildcards<Path>, string>,
        public request: Request,
        public info: Deno.ServeHandlerInfo,
    ) {
        this.response = new Response(null, { status: 204 });
    }

    public assert(condition: boolean, ...rest: ServerErrorParams) {
        if (!condition) {
            throw new ServerError(...rest);
        }
    }
}

export default Context;
