import { ServerError, ServerErrorInit } from "./error.ts";

export type ExtractParams<Path extends string> =
    Path extends `${infer _}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : Path extends `${infer _}:${infer P}` ? P : never;

export class Context<Path extends string> {
    public response: Response;

    constructor(public params: Record<ExtractParams<Path>, string>, public request: Request) {
        this.response = new Response(null, { status: 204 });
    }

    public assert(condition: boolean, error: ServerErrorInit = {}) {
        if (!condition) {
            throw new ServerError(error);
        }
    }
}

export default Context;
