import { v4 as uuidv4 } from 'uuid';
import { MCPSession, MCPMessageType } from './types.js';
import { logger } from '../utils/logger.js';

class SessionManager {
  private sessions: Map<string, MCPSession> = new Map();
  private readonly maxSessionDuration: number;
  private readonly maxSessionInactivity: number;

  constructor(maxSessionDuration = 3600000, maxSessionInactivity = 1800000) {
    this.maxSessionDuration = maxSessionDuration; // Default: 1 hour
    this.maxSessionInactivity = maxSessionInactivity; // Default: 30 minutes
    
    // Start cleanup interval
    setInterval(() => this.cleanupSessions(), 300000); // Run every 5 minutes
  }

  /**
   * Create a new MCP session
   */
  createSession(initialContext: Record<string, unknown> = {}): MCPSession {
    const sessionId = uuidv4();
    const now = new Date();
    
    const session: MCPSession = {
      id: sessionId,
      startTime: now,
      lastActivity: now,
      context: initialContext,
      history: []
    };
    
    this.sessions.set(sessionId, session);
    logger.info(`Created new MCP session: ${sessionId}`);
    
    return session;
  }

  /**
   * Get an existing session by ID
   */
  getSession(sessionId: string): MCPSession | undefined {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Update last activity time
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
    
    return session;
  }

  /**
   * Add a message to a session's history
   */
  addMessageToSession(sessionId: string, message: MCPMessageType): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      logger.warn(`Attempted to add message to non-existent session: ${sessionId}`);
      return false;
    }
    
    session.history.push(message);
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    
    return true;
  }

  /**
   * Update a session's context
   */
  updateSessionContext(sessionId: string, context: Record<string, unknown>): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      logger.warn(`Attempted to update context for non-existent session: ${sessionId}`);
      return false;
    }
    
    session.context = { ...session.context, ...context };
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    
    return true;
  }

  /**
   * End a session and remove it from memory
   */
  endSession(sessionId: string): boolean {
    if (!this.sessions.has(sessionId)) {
      logger.warn(`Attempted to end non-existent session: ${sessionId}`);
      return false;
    }
    
    this.sessions.delete(sessionId);
    logger.info(`Ended MCP session: ${sessionId}`);
    
    return true;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupSessions(): void {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now.getTime() - session.startTime.getTime();
      const inactivityTime = now.getTime() - session.lastActivity.getTime();
      
      if (sessionAge > this.maxSessionDuration || inactivityTime > this.maxSessionInactivity) {
        this.sessions.delete(sessionId);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired MCP sessions`);
    }
  }

  /**
   * Get the total number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager(); 