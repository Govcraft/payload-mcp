export interface MCPMessage {
    id: string;
    type: string;
    timestamp: string;
}
export interface MCPRequest extends MCPMessage {
    type: 'request';
    payload: {
        query: string;
        context?: Record<string, unknown>;
    };
}
export interface MCPResponse extends MCPMessage {
    type: 'response';
    payload: {
        content: string;
        metadata?: Record<string, unknown>;
    };
}
export interface MCPError extends MCPMessage {
    type: 'error';
    payload: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
export interface MCPStatus extends MCPMessage {
    type: 'status';
    payload: {
        status: 'processing' | 'completed' | 'failed';
        progress?: number;
        message?: string;
    };
}
export interface MCPToolCall extends MCPMessage {
    type: 'tool_call';
    payload: {
        tool: string;
        parameters: Record<string, unknown>;
    };
}
export interface MCPToolResult extends MCPMessage {
    type: 'tool_result';
    payload: {
        result: unknown;
        error?: string;
    };
}
export type MCPMessageType = MCPRequest | MCPResponse | MCPError | MCPStatus | MCPToolCall | MCPToolResult;
export interface MCPTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface MCPSession {
    id: string;
    startTime: Date;
    lastActivity: Date;
    context: Record<string, unknown>;
    history: MCPMessageType[];
}
export interface MCPConfig {
    maxSessionDuration: number;
    maxSessionInactivity: number;
    maxMessageSize: number;
    supportedTools: MCPTool[];
}
