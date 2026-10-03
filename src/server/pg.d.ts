declare module "pg" {
    export class Pool {
        constructor(config: {
            host?: string;
            port?: number;
            user?: string;
            password?: string;
            database?: string;
        });
        query(text: string, params?: unknown[]): Promise<{rows: unknown[]}>;
        on(event: string, listener: (...args: unknown[]) => void): void;
        end(): Promise<void>;
    }
}
