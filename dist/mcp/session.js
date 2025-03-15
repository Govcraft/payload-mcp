import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
class SessionManager {
    sessions = new Map();
    maxSessionDuration;
    maxSessionInactivity;
    constructor(maxSessionDuration = 3600000, maxSessionInactivity = 1800000) {
        this.maxSessionDuration = maxSessionDuration;
        this.maxSessionInactivity = maxSessionInactivity;
        setInterval(() => this.cleanupSessions(), 300000);
    }
    createSession(initialContext = {}) {
        const sessionId = uuidv4();
        const now = new Date();
        const session = {
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
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            this.sessions.set(sessionId, session);
        }
        return session;
    }
    addMessageToSession(sessionId, message) {
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
    updateSessionContext(sessionId, context) {
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
    endSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            logger.warn(`Attempted to end non-existent session: ${sessionId}`);
            return false;
        }
        this.sessions.delete(sessionId);
        logger.info(`Ended MCP session: ${sessionId}`);
        return true;
    }
    cleanupSessions() {
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
    getSessionCount() {
        return this.sessions.size;
    }
}
export const sessionManager = new SessionManager();
//# sourceMappingURL=session.js.map