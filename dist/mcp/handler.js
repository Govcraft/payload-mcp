import { v4 as uuidv4 } from 'uuid';
import { sessionManager } from './session.js';
import { logger } from '../utils/logger.js';
const availableTools = {};
export async function processRequest(request, sessionId) {
    try {
        let session = sessionId ? sessionManager.getSession(sessionId) : undefined;
        let currentSessionId;
        if (!session) {
            session = sessionManager.createSession(request.payload.context || {});
            currentSessionId = session.id;
        }
        else if (sessionId) {
            currentSessionId = sessionId;
            if (request.payload.context) {
                sessionManager.updateSessionContext(currentSessionId, request.payload.context);
            }
        }
        else {
            throw new Error('Session ID is undefined');
        }
        sessionManager.addMessageToSession(currentSessionId, request);
        const statusMessage = {
            id: uuidv4(),
            type: 'status',
            timestamp: new Date().toISOString(),
            payload: {
                status: 'processing',
                message: 'Processing your request'
            }
        };
        logger.debug('Processing request', { statusMessage });
        const responseMessage = {
            id: uuidv4(),
            type: 'response',
            timestamp: new Date().toISOString(),
            payload: {
                content: `Processed query: ${request.payload.query}`,
                metadata: {
                    sessionId: currentSessionId,
                    processingTime: '100ms'
                }
            }
        };
        sessionManager.addMessageToSession(currentSessionId, responseMessage);
        return responseMessage;
    }
    catch (error) {
        logger.error('Error processing MCP request', { error });
        const errorMessage = {
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'processing_error',
                message: 'Failed to process the request',
                details: {
                    originalError: error instanceof Error ? error.message : String(error)
                }
            }
        };
        if (sessionId) {
            sessionManager.addMessageToSession(sessionId, errorMessage);
        }
        return errorMessage;
    }
}
export function registerTool(tool) {
    availableTools[tool.name] = tool;
    logger.info(`Registered tool: ${tool.name}`);
}
export async function executeTool(toolCall, sessionId) {
    try {
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        sessionManager.addMessageToSession(sessionId, toolCall);
        const statusMessage = {
            id: uuidv4(),
            type: 'status',
            timestamp: new Date().toISOString(),
            payload: {
                status: 'processing',
                message: `Executing tool: ${toolCall.payload.tool}`
            }
        };
        logger.debug('Executing tool', { statusMessage });
        const tool = availableTools[toolCall.payload.tool];
        if (!tool) {
            throw new Error(`Tool not found: ${toolCall.payload.tool}`);
        }
        const result = await tool.handler(toolCall.payload.parameters);
        const toolResult = {
            id: uuidv4(),
            type: 'tool_result',
            timestamp: new Date().toISOString(),
            payload: {
                result
            }
        };
        sessionManager.addMessageToSession(sessionId, toolResult);
        return toolResult;
    }
    catch (error) {
        logger.error('Error executing tool', { error });
        const errorMessage = {
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'tool_execution_error',
                message: 'Failed to execute the tool',
                details: {
                    originalError: error instanceof Error ? error.message : String(error)
                }
            }
        };
        if (sessionId) {
            sessionManager.addMessageToSession(sessionId, errorMessage);
        }
        return errorMessage;
    }
}
export function getAvailableTools() {
    return Object.values(availableTools);
}
export function validateMessage(message) {
    if (!message || typeof message !== 'object') {
        return false;
    }
    const msg = message;
    if (!msg.id || typeof msg.id !== 'string') {
        return false;
    }
    if (!msg.type || typeof msg.type !== 'string') {
        return false;
    }
    if (!msg.timestamp || typeof msg.timestamp !== 'string') {
        return false;
    }
    if (!msg.payload || typeof msg.payload !== 'object') {
        return false;
    }
    return true;
}
//# sourceMappingURL=handler.js.map