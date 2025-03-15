import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
export const sseEmitter = new EventEmitter();
const activeConnections = new Map();
export function initializeSSE(res, sessionId) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const connectionMessage = {
        id: uuidv4(),
        type: 'status',
        timestamp: new Date().toISOString(),
        payload: {
            status: 'processing',
            message: 'SSE connection established'
        }
    };
    sendSSEMessage(res, connectionMessage);
    activeConnections.set(sessionId, res);
    logger.info(`SSE connection established for session: ${sessionId}`);
    res.on('close', () => {
        activeConnections.delete(sessionId);
        logger.info(`SSE connection closed for session: ${sessionId}`);
    });
}
export function sendMessageToClient(sessionId, message) {
    const connection = activeConnections.get(sessionId);
    if (!connection) {
        logger.warn(`Attempted to send message to non-existent SSE connection: ${sessionId}`);
        return false;
    }
    return sendSSEMessage(connection, message);
}
export function broadcastMessage(message) {
    for (const [sessionId, connection] of activeConnections.entries()) {
        sendSSEMessage(connection, message);
        logger.debug(`Broadcast message to session: ${sessionId}`);
    }
}
function sendSSEMessage(res, message) {
    try {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        res.write(data);
        return true;
    }
    catch (error) {
        logger.error('Error sending SSE message', { error });
        return false;
    }
}
export function closeSSEConnection(sessionId) {
    const connection = activeConnections.get(sessionId);
    if (!connection) {
        logger.warn(`Attempted to close non-existent SSE connection: ${sessionId}`);
        return false;
    }
    try {
        const endMessage = {
            id: uuidv4(),
            type: 'status',
            timestamp: new Date().toISOString(),
            payload: {
                status: 'completed',
                message: 'Connection closed by server'
            }
        };
        sendSSEMessage(connection, endMessage);
        connection.end();
        activeConnections.delete(sessionId);
        logger.info(`Closed SSE connection for session: ${sessionId}`);
        return true;
    }
    catch (error) {
        logger.error('Error closing SSE connection', { error });
        return false;
    }
}
export function getActiveConnectionsCount() {
    return activeConnections.size;
}
export function hasActiveConnection(sessionId) {
    return activeConnections.has(sessionId);
}
//# sourceMappingURL=sse.js.map