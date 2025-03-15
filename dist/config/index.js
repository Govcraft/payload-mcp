import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const args = process.argv.slice(2);
const enableStdio = args.includes('--stdio') || args.includes('-s');
const stdioOnly = args.includes('--stdio-only') || args.includes('-S');
export const config = {
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: process.env.NODE_ENV || 'development',
    },
    api: {
        prefix: process.env.API_PREFIX || '/api/v1',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    log: {
        level: process.env.LOG_LEVEL || 'info',
        dir: path.join(rootDir, 'logs'),
    },
    mcp: {
        enableStdio: enableStdio || process.env.ENABLE_STDIO === 'true',
        stdioOnly: stdioOnly || process.env.STDIO_ONLY === 'true'
    },
};
//# sourceMappingURL=index.js.map