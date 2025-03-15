import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
const logDir = config.log.dir;
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
export const logger = winston.createLogger({
    level: config.log.level,
    format: logFormat,
    defaultMeta: { service: 'mcp-server' },
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
        }),
    ],
    exitOnError: false,
});
//# sourceMappingURL=logger.js.map