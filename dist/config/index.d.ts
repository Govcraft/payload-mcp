interface ServerConfig {
    port: number;
    env: string;
}
interface ApiConfig {
    prefix: string;
}
interface CorsConfig {
    origin: string | string[];
}
interface LogConfig {
    level: string;
    dir: string;
}
interface MCPConfig {
    enableStdio: boolean;
    stdioOnly: boolean;
}
interface Config {
    server: ServerConfig;
    api: ApiConfig;
    cors: CorsConfig;
    log: LogConfig;
    mcp: MCPConfig;
}
export declare const config: Config;
export {};
