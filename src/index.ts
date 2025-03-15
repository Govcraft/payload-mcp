import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { initializeMCP } from './mcp/index.js';
import { healthRoutes } from './routes/health.js';
import { mcpRoutes } from './routes/mcp.js';
import payloadMcpRoutes from './routes/payload-mcp.routes.js';

// Check if we're in stdio-only mode (--stdio-only or -S flag)
const stdioOnlyMode = process.argv.includes('--stdio-only') || process.argv.includes('-S');

// Initialize MCP module
initializeMCP();

// Only start the HTTP server if not in stdio-only mode
if (!stdioOnlyMode) {
  const app: Application = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));

  // Routes
  app.use(`${config.api.prefix}/health`, healthRoutes);
  app.use(`${config.api.prefix}/mcp`, mcpRoutes);
  app.use(`${config.api.prefix}/payload-mcp`, payloadMcpRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  const server = app.listen(config.server.port, () => {
    logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
    logger.info(`API is available at http://localhost:${config.server.port}${config.api.prefix}`);
    logger.info(`MCP API is available at http://localhost:${config.server.port}${config.api.prefix}/mcp`);
    logger.info(`Payload MCP API is available at http://localhost:${config.server.port}${config.api.prefix}/payload-mcp`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
} else {
  logger.info('Running in stdio-only mode (HTTP server disabled)');
  
  // In stdio-only mode, we need to keep the process alive until stdin is closed
  // This is handled by the stdin handler
}

// Export the app for testing purposes
let app: Application | undefined;
if (!stdioOnlyMode) {
  app = express();
}
export default app; 