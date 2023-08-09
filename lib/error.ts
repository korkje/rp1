export type ServerErrorParams = [] | [status: number, message: string, expose?: boolean];

export class ServerError extends Error {
    public status: number;
    private exposed: boolean;

    constructor(...[
        status = 500,
        message = "Internal Server Error",
        expose = false,
    ]: ServerErrorParams) {
        super(message);
        this.status = status;
        this.exposed = expose;
    }

    public expose(expose?: boolean) {
        this.exposed = expose ?? true;
        return this;
    }

    public response() {
        const { status, message, exposed, stack } = this;

        const data = {
            status,
            message,
            stack: exposed ? stack : undefined,
            url: `https://http.cat/${this.status}`,
        };

        return Response.json(data, { status });
    }
}


export const error = (...params: ServerErrorParams) => new ServerError(...params);

export default error;
