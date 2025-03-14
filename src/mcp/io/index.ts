import { logger } from '../../utils/logger.js';
import { initializeStdinHandler, closeStdinHandler } from './stdin.js';
import { config } from '../../config/index.js';

/**
 * Initialize I/O handlers for MCP
 */
export function initializeIO(): void {
  logger.debug('Initializing MCP I/O handlers');
  
  // Initialize stdin handler if enabled
  if (config.mcp.enableStdio || config.mcp.stdioOnly) {
    initializeStdinHandler();
    logger.debug('Stdin handler initialized');
    
    // Set up process exit handlers
    process.on('SIGINT', () => {
      logger.debug('Received SIGINT, cleaning up I/O handlers');
      closeIO();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.debug('Received SIGTERM, cleaning up I/O handlers');
      closeIO();
      process.exit(0);
    });
  } else {
    logger.debug('Stdin handler not initialized (disabled in config)');
  }
}

/**
 * Close I/O handlers
 */
export function closeIO(): void {
  logger.debug('Closing MCP I/O handlers');
  
  // Close stdin handler if enabled
  if (config.mcp.enableStdio || config.mcp.stdioOnly) {
    closeStdinHandler();
    logger.debug('Stdin handler closed');
  }
} 