import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

// Ensure log directory exists
const logDir = config.log.dir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Check if running in stdio-only mode
const isStdioOnly = process.argv.includes('--stdio-only');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: { service: 'mcp-server' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs to combined.log
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

// If we're not in production, also log to the console
if (config.server.env !== 'production') {
  // When in stdio-only mode, use stderr instead of stdout to avoid interfering with JSON-RPC
  if (isStdioOnly) {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'], // Send all logs to stderr
    }));
  } else {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }));
  }
} 