#!/usr/bin/env node

import { logger } from './utils/logger.js';
import { initializeAnthropicMCP, runMCPServer } from './mcp/anthropic-mcp.js';

// Initialize MCP module
initializeAnthropicMCP();

logger.info('Running in stdio-only mode');

// Run the MCP server with stdio transport
runMCPServer().catch(err => {
  logger.error('Error running MCP server:', err);
  
  // Log more detailed error information
  if (err instanceof Error) {
    logger.error(`Error details: ${err.message}`, {
      stack: err.stack,
      name: err.name
    });
  }
  
  process.exit(1);
}); 