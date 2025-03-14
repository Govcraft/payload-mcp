import { v4 as uuidv4 } from 'uuid';
import { 
  MCPMessage, 
  MCPRequest, 
  MCPResponse, 
  MCPError, 
  MCPStatus,
  MCPToolCall,
  MCPToolResult,
  MCPTool
} from './types.js';
import { sessionManager } from './session.js';
import { logger } from '../utils/logger.js';

// Available tools
const availableTools: Record<string, MCPTool> = {};

/**
 * Process an incoming MCP request
 */
export async function processRequest(
  request: MCPRequest, 
  sessionId?: string
): Promise<MCPResponse | MCPError> {
  try {
    // Create or get session
    let session = sessionId ? sessionManager.getSession(sessionId) : undefined;
    let currentSessionId: string;
    
    if (!session) {
      session = sessionManager.createSession(request.payload.context || {});
      currentSessionId = session.id;
    } else if (sessionId) {
      currentSessionId = sessionId;
      if (request.payload.context) {
        // Update session context if provided
        sessionManager.updateSessionContext(currentSessionId, request.payload.context);
      }
    } else {
      // This should never happen, but TypeScript needs this check
      throw new Error('Session ID is undefined');
    }
    
    // Add request to session history
    sessionManager.addMessageToSession(currentSessionId, request);
    
    // Send status update (in a real implementation, this would be sent via WebSocket)
    const statusMessage: MCPStatus = {
      id: uuidv4(),
      type: 'status',
      timestamp: new Date().toISOString(),
      payload: {
        status: 'processing',
        message: 'Processing your request'
      }
    };
    
    // In a real implementation, this would be sent to the client
    logger.debug('Status update', { status: statusMessage });
    
    // Process the request (in a real implementation, this might involve calling an LLM)
    // For now, we'll just echo back the query
    const responseMessage: MCPResponse = {
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
    
    // Add response to session history
    sessionManager.addMessageToSession(currentSessionId, responseMessage);
    
    return responseMessage;
  } catch (error) {
    logger.error('Error processing MCP request', { error });
    
    const errorMessage: MCPError = {
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

/**
 * Register a new tool
 */
export function registerTool(tool: MCPTool): void {
  availableTools[tool.name] = tool;
  logger.info(`Registered MCP tool: ${tool.name}`);
}

/**
 * Execute a tool call
 */
export async function executeTool(
  toolCall: MCPToolCall, 
  sessionId: string
): Promise<MCPToolResult> {
  const { tool: toolName, parameters } = toolCall.payload;
  
  try {
    // Check if tool exists
    if (!availableTools[toolName]) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Execute the tool
    const tool = availableTools[toolName];
    const result = await tool.handler(parameters);
    
    const toolResult: MCPToolResult = {
      id: uuidv4(),
      type: 'tool_result',
      timestamp: new Date().toISOString(),
      payload: {
        result
      }
    };
    
    // Add tool result to session history
    sessionManager.addMessageToSession(sessionId, toolResult);
    
    return toolResult;
  } catch (error) {
    logger.error(`Error executing tool ${toolName}`, { error, parameters });
    
    const toolResult: MCPToolResult = {
      id: uuidv4(),
      type: 'tool_result',
      timestamp: new Date().toISOString(),
      payload: {
        result: null,
        error: error instanceof Error ? error.message : String(error)
      }
    };
    
    // Add tool result to session history
    sessionManager.addMessageToSession(sessionId, toolResult);
    
    return toolResult;
  }
}

/**
 * Get all available tools
 */
export function getAvailableTools(): MCPTool[] {
  return Object.values(availableTools);
}

/**
 * Validate an MCP message
 */
export function validateMessage(message: unknown): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  const msg = message as Partial<MCPMessage> & { payload?: unknown };
  
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    typeof msg.timestamp === 'string' &&
    msg.payload !== undefined
  );
} 