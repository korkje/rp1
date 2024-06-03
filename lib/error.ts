/**
 * ServerError parameters.
 */
export type ServerErrorParams = [] | [status: number, message: string, expose?: boolean];

/**
 * Class representing a server error.
 */
export class ServerError extends Error {
    public status: number;
    private exposed: boolean;

    constructor(...[
        status = 500,
        message = "Internal Server Error",
        expose = false,
    ]: ServerErrorParams) {
        super(message);
        this.name = `ServerError(${status})`;
        this.status = status;
        this.exposed = expose;
    }

    public toString(): string {
        return `${this.name}: ${this.message}`;
    }

    public expose(expose?: boolean): this {
        this.exposed = expose ?? true;
        return this;
    }

    public response(): Response {
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

/**
 * Creates a new ServerError instance.
 *
 * @param params - Parameters for the ServerError instance.
 * @returns
 */
export const error = (...params: ServerErrorParams): ServerError => new ServerError(...params);

export default error;
