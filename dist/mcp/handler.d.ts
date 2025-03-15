import { MCPRequest, MCPResponse, MCPError, MCPToolCall, MCPToolResult, MCPTool } from './types.js';
export declare function processRequest(request: MCPRequest, sessionId?: string): Promise<MCPResponse | MCPError>;
export declare function registerTool(tool: MCPTool): void;
export declare function executeTool(toolCall: MCPToolCall, sessionId: string): Promise<MCPToolResult | MCPError>;
export declare function getAvailableTools(): MCPTool[];
export declare function validateMessage(message: unknown): boolean;
