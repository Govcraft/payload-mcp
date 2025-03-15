import readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { processRequest, executeTool, validateMessage } from '../handler.js';
import { logger } from '../../utils/logger.js';
const isPipeMode = !process.stdin.isTTY;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
let sessionId;
let hasProcessedInput = false;
export function initializeStdinHandler() {
    logger.info('Initializing standard I/O handler for MCP');
    rl.on('line', async (line) => {
        try {
            if (!line.trim()) {
                return;
            }
            hasProcessedInput = true;
            let input;
            try {
                input = JSON.parse(line);
            }
            catch (error) {
                input = {
                    id: uuidv4(),
                    type: 'request',
                    timestamp: new Date().toISOString(),
                    payload: {
                        query: line
                    }
                };
            }
            if (!validateMessage(input)) {
                const errorResponse = {
                    id: uuidv4(),
                    type: 'error',
                    timestamp: new Date().toISOString(),
                    payload: {
                        code: 'invalid_request',
                        message: 'Invalid MCP message format'
                    }
                };
                console.log(JSON.stringify(errorResponse));
                return;
            }
            if (input.type === 'request') {
                const request = input;
                const response = await processRequest(request, sessionId);
                if (!sessionId && response.type === 'response' && response.payload.metadata?.sessionId) {
                    sessionId = response.payload.metadata.sessionId;
                    logger.info(`CLI session established with ID: ${sessionId}`);
                }
                console.log(JSON.stringify(response));
            }
            else if (input.type === 'tool_call') {
                if (!sessionId) {
                    const errorResponse = {
                        id: uuidv4(),
                        type: 'error',
                        timestamp: new Date().toISOString(),
                        payload: {
                            code: 'missing_session',
                            message: 'No active session for tool call'
                        }
                    };
                    console.log(JSON.stringify(errorResponse));
                    return;
                }
                const toolCall = input;
                const toolResult = await executeTool(toolCall, sessionId);
                console.log(JSON.stringify(toolResult));
            }
            else {
                const errorResponse = {
                    id: uuidv4(),
                    type: 'error',
                    timestamp: new Date().toISOString(),
                    payload: {
                        code: 'unsupported_message_type',
                        message: `Unsupported message type: ${input.type}`
                    }
                };
                console.log(JSON.stringify(errorResponse));
            }
        }
        catch (error) {
            logger.error('Error processing stdin input', { error });
            const errorResponse = {
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'processing_error',
                    message: 'Error processing input',
                    details: {
                        error: error instanceof Error ? error.message : String(error)
                    }
                }
            };
            console.log(JSON.stringify(errorResponse));
        }
    });
    rl.on('close', () => {
        logger.info('Standard input stream closed');
        if (isPipeMode && hasProcessedInput) {
            logger.info('Exiting after processing piped input');
            process.exit(0);
        }
    });
    logger.info('Standard I/O handler initialized');
}
export function closeStdinHandler() {
    rl.close();
    logger.info('Standard I/O handler closed');
}
//# sourceMappingURL=stdin.js.map