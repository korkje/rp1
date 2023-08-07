export type ServerErrorInit = {
    status?: number;
    message?: string;
    expose?: boolean;
    log?: boolean;
};

export class ServerError extends Error {
    private status: number;
    private expose: boolean;
    public log: boolean;

    constructor({
        status = 500,
        message = "Internal Server Error",
        expose = false,
        log = false,
    }: ServerErrorInit = {}) {
        super(message);
        this.status = status;
        this.expose = expose;
        this.log = log;
    }

    response() {
        const error = {
            message: this.message,
            stack: this.expose ? this.stack: undefined,
            status: this.status,
            url: `https://http.cat/${this.status}`,
        };

        return Response.json({ error }, { status: this.status });
    }
}

export default ServerError;
