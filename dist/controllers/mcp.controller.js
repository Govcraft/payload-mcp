import { v4 as uuidv4 } from 'uuid';
import { processRequest, executeTool, getAvailableTools, validateMessage } from '../mcp/handler.js';
import { logger } from '../utils/logger.js';
import { initializeSSE, sendMessageToClient, hasActiveConnection } from '../mcp/sse.js';
import { sessionManager } from '../mcp/session.js';
export async function handleSSEConnection(req, res) {
    try {
        let sessionId = req.query.sessionId;
        if (!sessionId) {
            const session = sessionManager.createSession({});
            sessionId = session.id;
        }
        else if (!sessionManager.getSession(sessionId)) {
            const session = sessionManager.createSession({});
            sessionId = session.id;
        }
        initializeSSE(res, sessionId);
    }
    catch (error) {
        logger.error('Error establishing SSE connection', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Failed to establish SSE connection',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
export async function handleSSERequest(req, res) {
    try {
        const { body } = req;
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'missing_session',
                    message: 'Session ID is required for SSE requests'
                }
            });
            return;
        }
        if (!hasActiveConnection(sessionId)) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'no_sse_connection',
                    message: 'No active SSE connection for this session'
                }
            });
            return;
        }
        if (!validateMessage(body)) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'invalid_request',
                    message: 'Invalid MCP request format'
                }
            });
            return;
        }
        const mcpRequest = body;
        res.status(202).json({
            id: uuidv4(),
            type: 'status',
            timestamp: new Date().toISOString(),
            payload: {
                status: 'processing',
                message: 'Request accepted and being processed'
            }
        });
        processRequest(mcpRequest, sessionId)
            .then(response => {
            sendMessageToClient(sessionId, response);
        })
            .catch(error => {
            logger.error('Error processing SSE request', { error });
            const errorResponse = {
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'processing_error',
                    message: 'Error processing request',
                    details: {
                        error: error instanceof Error ? error.message : String(error)
                    }
                }
            };
            sendMessageToClient(sessionId, errorResponse);
        });
    }
    catch (error) {
        logger.error('Error handling SSE request', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Internal server error',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
export async function handleMCPRequest(req, res) {
    try {
        const { body } = req;
        const sessionId = req.headers['x-mcp-session-id'];
        if (!validateMessage(body)) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'invalid_request',
                    message: 'Invalid MCP request format'
                }
            });
            return;
        }
        const mcpRequest = body;
        const response = await processRequest(mcpRequest, sessionId);
        if (!sessionId && response.type === 'response' && response.payload.metadata?.sessionId) {
            res.setHeader('X-MCP-Session-ID', response.payload.metadata.sessionId);
        }
        res.status(200).json(response);
    }
    catch (error) {
        logger.error('Error handling MCP request', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Internal server error',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
export async function handleToolCall(req, res) {
    try {
        const { body } = req;
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'missing_session',
                    message: 'Session ID is required for tool calls'
                }
            });
            return;
        }
        if (!validateMessage(body) || body.type !== 'tool_call') {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'invalid_tool_call',
                    message: 'Invalid tool call format'
                }
            });
            return;
        }
        const toolCall = body;
        const toolResult = await executeTool(toolCall, sessionId);
        res.status(200).json(toolResult);
    }
    catch (error) {
        logger.error('Error handling tool call', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Internal server error',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
export function getTools(_req, res) {
    try {
        const tools = getAvailableTools();
        res.status(200).json({
            id: uuidv4(),
            type: 'tools_list',
            timestamp: new Date().toISOString(),
            payload: {
                tools: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }))
            }
        });
    }
    catch (error) {
        logger.error('Error getting tools list', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Internal server error',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
export async function handleSSEToolCall(req, res) {
    try {
        const { body } = req;
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'missing_session',
                    message: 'Session ID is required for tool calls'
                }
            });
            return;
        }
        if (!hasActiveConnection(sessionId)) {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'no_sse_connection',
                    message: 'No active SSE connection for this session'
                }
            });
            return;
        }
        if (!validateMessage(body) || body.type !== 'tool_call') {
            res.status(400).json({
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'invalid_tool_call',
                    message: 'Invalid tool call format'
                }
            });
            return;
        }
        const toolCall = body;
        res.status(202).json({
            id: uuidv4(),
            type: 'status',
            timestamp: new Date().toISOString(),
            payload: {
                status: 'processing',
                message: 'Tool call accepted and being processed'
            }
        });
        executeTool(toolCall, sessionId)
            .then(toolResult => {
            sendMessageToClient(sessionId, toolResult);
        })
            .catch(error => {
            logger.error('Error executing tool via SSE', { error });
            const errorResponse = {
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'tool_execution_error',
                    message: 'Error executing tool',
                    details: {
                        error: error instanceof Error ? error.message : String(error)
                    }
                }
            };
            sendMessageToClient(sessionId, errorResponse);
        });
    }
    catch (error) {
        logger.error('Error handling SSE tool call', { error });
        res.status(500).json({
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
                code: 'server_error',
                message: 'Internal server error',
                details: {
                    error: error instanceof Error ? error.message : String(error)
                }
            }
        });
    }
}
//# sourceMappingURL=mcp.controller.js.map