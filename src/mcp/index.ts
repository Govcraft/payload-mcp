import { registerTool } from './handler.js';
import { initializeIO } from './io/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { payloadTools } from './generated/payload-tools.js';
import { tools as customTools } from './tools/index.js';

/**
 * Initialize the MCP module and register available tools
 */
export function initializeMCP(): void {
  logger.info('Initializing MCP module...');
  
  // Register auto-generated Payload CMS tools
  logger.info('Registering auto-generated Payload CMS tools...');
  payloadTools.forEach(tool => {
    registerTool(tool);
    logger.info(`Registered Payload CMS tool: ${tool.name}`);
  });
  
  // Register custom tools
  logger.info('Registering custom tools...');
  customTools.forEach(tool => {
    registerTool(tool);
    logger.info(`Registered custom tool: ${tool.name}`);
  });
  
  // Initialize I/O handlers if enabled
  if (config.mcp.enableStdio || config.mcp.stdioOnly) {
    initializeIO();
    logger.info(`MCP I/O handlers initialized (stdio-only mode: ${config.mcp.stdioOnly ? 'enabled' : 'disabled'})`);
  } else {
    logger.info('MCP I/O handlers disabled');
  }
  
  logger.info('MCP module initialized');
} 