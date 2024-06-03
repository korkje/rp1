/**
 * @module
 * Exports the {@link Context} class.
 */

import { ServerError, type ServerErrorParams } from "lib/error.ts";
import type Params from "lib/params.ts";

/**
 * Class that represents the context of a request.
 */
export class Context<Path extends string = string> {
    public response: Response;

    constructor(
        public params: { [key in Params<Path>]: string } & URLPatternComponentResult["groups"],
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
