/**
 * Model Context Protocol (MCP) Types
 * Based on Anthropic's MCP specification
 */

// Base message type
export interface MCPMessage {
  id: string;
  type: string;
  timestamp: string;
}

// Request message from the client
export interface MCPRequest extends MCPMessage {
  type: 'request';
  payload: {
    query: string;
    context?: Record<string, unknown>;
  };
}

// Response message to the client
export interface MCPResponse extends MCPMessage {
  type: 'response';
  payload: {
    content: string;
    metadata?: Record<string, unknown>;
  };
}

// Error message to the client
export interface MCPError extends MCPMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Status update message to the client
export interface MCPStatus extends MCPMessage {
  type: 'status';
  payload: {
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    message?: string;
  };
}

// Tool call message from the server
export interface MCPToolCall extends MCPMessage {
  type: 'tool_call';
  payload: {
    tool: string;
    parameters: Record<string, unknown>;
  };
}

// Tool result message from the client
export interface MCPToolResult extends MCPMessage {
  type: 'tool_result';
  payload: {
    result: unknown;
    error?: string;
  };
}

// Union type of all MCP messages
export type MCPMessageType = 
  | MCPRequest 
  | MCPResponse 
  | MCPError 
  | MCPStatus 
  | MCPToolCall 
  | MCPToolResult;

// Tool definition
export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

// MCP session state
export interface MCPSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  context: Record<string, unknown>;
  history: MCPMessageType[];
}

// MCP server configuration
export interface MCPConfig {
  maxSessionDuration: number; // in milliseconds
  maxSessionInactivity: number; // in milliseconds
  maxMessageSize: number; // in bytes
  supportedTools: MCPTool[];
} 