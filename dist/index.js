import { logger } from './utils/logger.js';
import { initializeAnthropicMCP, runMCPServer } from './mcp/anthropic-mcp.js';
initializeAnthropicMCP();
logger.info('Running in stdio-only mode');
runMCPServer().catch(err => {
    logger.error('Error running MCP server:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map