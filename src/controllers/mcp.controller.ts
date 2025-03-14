import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MCPRequest, MCPToolCall } from '../mcp/types.js';
import { processRequest, executeTool, getAvailableTools, validateMessage } from '../mcp/handler.js';
import { logger } from '../utils/logger.js';

/**
 * Handle a new MCP request
 */
export async function handleMCPRequest(req: Request, res: Response): Promise<void> {
  try {
    const { body } = req;
    const sessionId = req.headers['x-mcp-session-id'] as string | undefined;
    
    // Validate request
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
    
    const mcpRequest = body as MCPRequest;
    
    // Process the request
    const response = await processRequest(mcpRequest, sessionId);
    
    // Set session ID header if it's a new session
    if (!sessionId && response.type === 'response' && response.payload.metadata?.sessionId) {
      res.setHeader('X-MCP-Session-ID', response.payload.metadata.sessionId as string);
    }
    
    res.status(200).json(response);
  } catch (error) {
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

/**
 * Handle a tool call
 */
export async function handleToolCall(req: Request, res: Response): Promise<void> {
  try {
    const { body } = req;
    const sessionId = req.headers['x-mcp-session-id'] as string;
    
    // Validate session ID
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
    
    // Validate request
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
    
    const toolCall = body as MCPToolCall;
    
    // Execute the tool
    const toolResult = await executeTool(toolCall, sessionId);
    
    res.status(200).json(toolResult);
  } catch (error) {
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

/**
 * Get available tools
 */
export function getTools(_req: Request, res: Response): void {
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
  } catch (error) {
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