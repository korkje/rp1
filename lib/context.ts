import { ServerError, ServerErrorParams } from "./error.ts";
import Params from "./params.ts";

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
