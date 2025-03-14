import { registerTool } from './handler.js';
import { calculatorTool } from './tools/calculator.js';
import { initializeIO } from './io/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Initialize the MCP module and register available tools
 */
export function initializeMCP(): void {
  logger.info('Initializing MCP module...');
  
  // Register available tools
  registerTool(calculatorTool);
  
  // Initialize I/O handlers if enabled
  if (config.mcp.enableStdio || config.mcp.stdioOnly) {
    initializeIO();
    logger.info(`MCP I/O handlers initialized (stdio-only mode: ${config.mcp.stdioOnly ? 'enabled' : 'disabled'})`);
  } else {
    logger.info('MCP I/O handlers disabled');
  }
  
  logger.info('MCP module initialized');
} 