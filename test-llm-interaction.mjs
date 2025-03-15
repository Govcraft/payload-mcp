// Test script that simulates an LLM interaction with our MCP server
import { spawn } from 'child_process';
import readline from 'readline';

// Get the tool call from command line arguments or use a default
const toolCall = process.argv[2] || JSON.stringify({
  type: 'tool_call',
  payload: {
    tool: 'listTools',
    parameters: {
      includeParameters: true
    }
  }
});

// Start the MCP server process
const mcpProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Create readline interface for reading from the MCP server
const rl = readline.createInterface({
  input: mcpProcess.stdout,
  crlfDelay: Infinity
});

// Flag to track if we've sent the tool call
let toolCallSent = false;
let readyForToolCall = false;

// Listen for messages from the MCP server
rl.on('line', (line) => {
  // Only try to parse lines that look like JSON (start with '{')
  if (line.trim().startsWith('{')) {
    try {
      const message = JSON.parse(line);
      
      // If the server is ready and we haven't sent the tool call yet
      if (message.type === 'status' && message.payload.status === 'ready' && !toolCallSent) {
        // Send the tool call
        mcpProcess.stdin.write(toolCall + '\n');
        toolCallSent = true;
        console.log('Sent tool call to MCP server:', JSON.parse(toolCall).payload.tool);
      }
      
      // If we receive a tool result, print it and exit
      if (message.type === 'tool_result') {
        console.log('\nReceived tool result from MCP server:');
        console.log('-----------------------------------------------------------');
        console.log(JSON.stringify(message.payload.result, null, 2));
        console.log('-----------------------------------------------------------');
        
        // Exit after receiving the tool result
        setTimeout(() => {
          mcpProcess.kill();
          process.exit(0);
        }, 100);
      }
    } catch (error) {
      console.error('Error parsing JSON message:', error.message);
    }
  } else {
    // For non-JSON lines, check if it indicates the server is ready
    if (line.includes('MCP module initialized') || line.includes('Server started')) {
      readyForToolCall = true;
      
      // If we're ready but haven't sent the tool call yet, send it now
      if (readyForToolCall && !toolCallSent) {
        setTimeout(() => {
          mcpProcess.stdin.write(toolCall + '\n');
          toolCallSent = true;
          console.log('Sent tool call to MCP server:', JSON.parse(toolCall).payload.tool);
        }, 1000); // Wait a second to make sure the server is fully ready
      }
    }
    
    // Log non-JSON output for debugging
    console.log('Server output:', line);
  }
});

// Handle process exit
mcpProcess.on('exit', (code) => {
  console.log(`MCP server process exited with code ${code}`);
  process.exit(code);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  mcpProcess.kill();
  process.exit(0);
}); 