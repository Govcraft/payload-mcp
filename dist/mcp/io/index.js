import { logger } from '../../utils/logger.js';
import { initializeStdinHandler, closeStdinHandler } from './stdin.js';
import { config } from '../../config/index.js';
export function initializeIO() {
    logger.debug('Initializing MCP I/O handlers');
    if (config.mcp.enableStdio || config.mcp.stdioOnly) {
        initializeStdinHandler();
        logger.debug('Stdin handler initialized');
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
    }
    else {
        logger.debug('Stdin handler not initialized (disabled in config)');
    }
}
export function closeIO() {
    logger.debug('Closing MCP I/O handlers');
    if (config.mcp.enableStdio || config.mcp.stdioOnly) {
        closeStdinHandler();
        logger.debug('Stdin handler closed');
    }
}
//# sourceMappingURL=index.js.map