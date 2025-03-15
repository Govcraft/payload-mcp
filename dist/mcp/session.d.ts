import { MCPSession, MCPMessageType } from './types.js';
declare class SessionManager {
    private sessions;
    private readonly maxSessionDuration;
    private readonly maxSessionInactivity;
    constructor(maxSessionDuration?: number, maxSessionInactivity?: number);
    createSession(initialContext?: Record<string, unknown>): MCPSession;
    getSession(sessionId: string): MCPSession | undefined;
    addMessageToSession(sessionId: string, message: MCPMessageType): boolean;
    updateSessionContext(sessionId: string, context: Record<string, unknown>): boolean;
    endSession(sessionId: string): boolean;
    private cleanupSessions;
    getSessionCount(): number;
}
export declare const sessionManager: SessionManager;
export {};
