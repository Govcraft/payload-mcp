import readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { MCPRequest, MCPResponse, MCPError, MCPToolCall, MCPToolResult } from '../types.js';
import { processRequest, executeTool, validateMessage } from '../handler.js';
import { logger } from '../../utils/logger.js';

// Detect if we're in pipe mode (stdin is not a TTY)
const isPipeMode = !process.stdin.isTTY;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Session ID for the current CLI session
let sessionId: string | undefined;

// Track if we've processed any input
let hasProcessedInput = false;

/**
 * Initialize the standard input handler
 */
export function initializeStdinHandler(): void {
  logger.info('Initializing standard I/O handler for MCP');
  
  // Handle line input
  rl.on('line', async (line) => {
    try {
      // Skip empty lines
      if (!line.trim()) {
        return;
      }
      
      // Mark that we've processed input
      hasProcessedInput = true;
      
      // Parse input as JSON
      let input: unknown;
      try {
        input = JSON.parse(line);
      } catch (error) {
        // If not valid JSON, treat as a plain text query
        input = {
          id: uuidv4(),
          type: 'request',
          timestamp: new Date().toISOString(),
          payload: {
            query: line
          }
        };
      }
      
      // Validate message
      if (!validateMessage(input)) {
        const errorResponse = {
          id: uuidv4(),
          type: 'error',
          timestamp: new Date().toISOString(),
          payload: {
            code: 'invalid_request',
            message: 'Invalid MCP message format'
          }
        };
        
        console.log(JSON.stringify(errorResponse));
        return;
      }
      
      // Process based on message type
      if ((input as MCPRequest).type === 'request') {
        const request = input as MCPRequest;
        const response = await processRequest(request, sessionId);
        
        // Store session ID if it's a new session
        if (!sessionId && response.type === 'response' && response.payload.metadata?.sessionId) {
          sessionId = response.payload.metadata.sessionId as string;
          logger.info(`CLI session established with ID: ${sessionId}`);
        }
        
        // Output response
        console.log(JSON.stringify(response));
      } else if ((input as MCPToolCall).type === 'tool_call') {
        if (!sessionId) {
          const errorResponse = {
            id: uuidv4(),
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: {
              code: 'missing_session',
              message: 'No active session for tool call'
            }
          };
          
          console.log(JSON.stringify(errorResponse));
          return;
        }
        
        const toolCall = input as MCPToolCall;
        const toolResult = await executeTool(toolCall, sessionId);
        
        // Output tool result
        console.log(JSON.stringify(toolResult));
      } else {
        const errorResponse = {
          id: uuidv4(),
          type: 'error',
          timestamp: new Date().toISOString(),
          payload: {
            code: 'unsupported_message_type',
            message: `Unsupported message type: ${(input as { type: string }).type}`
          }
        };
        
        console.log(JSON.stringify(errorResponse));
      }
    } catch (error) {
      logger.error('Error processing stdin input', { error });
      
      const errorResponse = {
        id: uuidv4(),
        type: 'error',
        timestamp: new Date().toISOString(),
        payload: {
          code: 'processing_error',
          message: 'Error processing input',
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        }
      };
      
      console.log(JSON.stringify(errorResponse));
    }
  });
  
  // Handle close event (stdin has ended)
  rl.on('close', () => {
    logger.info('Standard input stream closed');
    
    // If we're in pipe mode and have processed input, exit the process
    if (isPipeMode && hasProcessedInput) {
      logger.info('Exiting after processing piped input');
      process.exit(0);
    }
    // Otherwise, don't exit the process, as the HTTP server might still be running
  });
  
  logger.info('Standard I/O handler initialized');
}

/**
 * Close the readline interface
 */
export function closeStdinHandler(): void {
  rl.close();
  logger.info('Standard I/O handler closed');
} 