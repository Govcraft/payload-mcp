import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { payloadTools } from '../mcp/generated/payload-tools.js';
import { tools as customTools } from '../mcp/tools/index.js';
import { initializeSSE, sendMessageToClient, hasActiveConnection } from '../mcp/sse.js';
import { sessionManager } from '../mcp/session.js';
export async function handlePayloadMCPSSEConnection(req, res) {
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
        logger.error('Error establishing Payload MCP SSE connection', { error });
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
export async function handlePayloadMCPSSERequest(req, res) {
    try {
        const { model, tools, context = [] } = req.body;
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId) {
            res.status(400).json({
                error: 'Bad request',
                message: 'Session ID is required for SSE requests'
            });
            return;
        }
        if (!hasActiveConnection(sessionId)) {
            res.status(400).json({
                error: 'Bad request',
                message: 'No active SSE connection for this session'
            });
            return;
        }
        logger.debug('Received Payload MCP SSE request', { model, toolsCount: tools?.length });
        res.status(202).json({
            id: uuidv4(),
            message: 'Request accepted and being processed'
        });
        try {
            const allTools = [...payloadTools, ...customTools];
            const toolsMap = allTools.reduce((acc, tool) => {
                acc[tool.name] = tool;
                return acc;
            }, {});
            const toolResults = [];
            if (tools && Array.isArray(tools)) {
                for (const tool of tools) {
                    const { name, parameters } = tool;
                    if (!toolsMap[name]) {
                        logger.warn(`Tool not found: ${name}`);
                        toolResults.push({
                            tool_name: name,
                            output: { error: `Tool not found: ${name}` }
                        });
                        continue;
                    }
                    logger.debug(`Executing tool: ${name}`, { parameters });
                    try {
                        const result = await toolsMap[name].handler(parameters);
                        toolResults.push({
                            tool_name: name,
                            output: result
                        });
                        context.push({
                            id: uuidv4(),
                            data: result
                        });
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        logger.error(`Error executing tool: ${name}`, { error, parameters });
                        toolResults.push({
                            tool_name: name,
                            output: { error: `Error executing tool: ${errorMessage}` }
                        });
                    }
                }
            }
            const response = {
                id: uuidv4(),
                type: 'response',
                timestamp: new Date().toISOString(),
                payload: {
                    context,
                    tool_results: toolResults.length > 0 ? toolResults : undefined
                }
            };
            sendMessageToClient(sessionId, response);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Error processing Payload MCP SSE request', { error });
            const errorResponse = {
                id: uuidv4(),
                type: 'error',
                timestamp: new Date().toISOString(),
                payload: {
                    code: 'processing_error',
                    message: errorMessage
                }
            };
            sendMessageToClient(sessionId, errorResponse);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error handling Payload MCP SSE request', { error });
        res.status(500).json({
            error: 'Internal server error',
            message: errorMessage
        });
    }
}
export async function handlePayloadMCPRequest(req, res) {
    try {
        const { model, tools, context = [] } = req.body;
        logger.debug('Received Payload MCP request', { model, toolsCount: tools?.length });
        const allTools = [...payloadTools, ...customTools];
        const toolsMap = allTools.reduce((acc, tool) => {
            acc[tool.name] = tool;
            return acc;
        }, {});
        const toolResults = [];
        if (tools && Array.isArray(tools)) {
            for (const tool of tools) {
                const { name, parameters } = tool;
                if (!toolsMap[name]) {
                    logger.warn(`Tool not found: ${name}`);
                    toolResults.push({
                        tool_name: name,
                        output: { error: `Tool not found: ${name}` }
                    });
                    continue;
                }
                logger.debug(`Executing tool: ${name}`, { parameters });
                try {
                    const result = await toolsMap[name].handler(parameters);
                    toolResults.push({
                        tool_name: name,
                        output: result
                    });
                    context.push({
                        id: uuidv4(),
                        data: result
                    });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger.error(`Error executing tool: ${name}`, { error, parameters });
                    toolResults.push({
                        tool_name: name,
                        output: { error: `Error executing tool: ${errorMessage}` }
                    });
                }
            }
        }
        const response = {
            id: uuidv4(),
            context,
            tool_results: toolResults.length > 0 ? toolResults : undefined
        };
        res.json(response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error handling Payload MCP request', { error });
        res.status(500).json({
            error: 'Internal server error',
            message: errorMessage
        });
    }
}
//# sourceMappingURL=payload-mcp.controller.js.map