# Model Context Protocol (MCP) Documentation

The Model Context Protocol (MCP) is a standardized interface for connecting AI assistants like Claude to external data sources and systems. This document provides an overview of the protocol and how it's implemented in this server.

## Protocol Overview

MCP defines a message-based protocol for communication between AI assistants and external systems. The protocol supports:

1. **Queries**: Sending natural language queries from the AI to external systems
2. **Responses**: Receiving structured data responses
3. **Tool Calls**: Executing specific functions in external systems
4. **Session Management**: Maintaining context across multiple interactions

## Message Types

### 1. Request

A request is sent from the AI assistant to the MCP server to query information or perform an action.

```json
{
  "id": "req-123",
  "type": "request",
  "timestamp": "2023-01-01T00:00:00Z",
  "payload": {
    "query": "What is the weather in San Francisco?",
    "metadata": {
      "user_id": "user-123",
      "session_id": "session-456"
    }
  }
}
```

### 2. Response

A response is sent from the MCP server back to the AI assistant with the requested information.

```json
{
  "id": "res-123",
  "type": "response",
  "timestamp": "2023-01-01T00:00:01Z",
  "payload": {
    "content": "The current weather in San Francisco is 65°F and partly cloudy.",
    "metadata": {
      "source": "weather-api",
      "session_id": "session-456"
    }
  }
}
```

### 3. Tool Call

A tool call is sent from the AI assistant to the MCP server to execute a specific function.

```json
{
  "id": "tool-123",
  "type": "tool_call",
  "timestamp": "2023-01-01T00:00:02Z",
  "payload": {
    "tool": "weather",
    "parameters": {
      "location": "San Francisco",
      "unit": "fahrenheit"
    },
    "metadata": {
      "session_id": "session-456"
    }
  }
}
```

### 4. Tool Result

A tool result is sent from the MCP server back to the AI assistant with the result of a tool execution.

```json
{
  "id": "result-123",
  "type": "tool_result",
  "timestamp": "2023-01-01T00:00:03Z",
  "payload": {
    "result": {
      "temperature": 65,
      "conditions": "partly cloudy",
      "location": "San Francisco",
      "unit": "fahrenheit"
    },
    "metadata": {
      "session_id": "session-456"
    }
  }
}
```

### 5. Error

An error message is sent when something goes wrong during processing.

```json
{
  "id": "err-123",
  "type": "error",
  "timestamp": "2023-01-01T00:00:04Z",
  "payload": {
    "code": "invalid_parameters",
    "message": "Missing required parameter: location",
    "details": {
      "tool": "weather",
      "missing_parameters": ["location"]
    }
  }
}
```

## Session Management

MCP supports maintaining context across multiple interactions through session management. Each session has a unique ID that is included in the metadata of messages.

When a new request is received without a session ID, the server creates a new session and returns the session ID in the response. Subsequent requests can include this session ID to maintain context.

## Tools

Tools are functions that can be executed by the MCP server. Each tool has:

1. **Name**: A unique identifier for the tool
2. **Description**: A description of what the tool does
3. **Parameters**: The parameters that the tool accepts
4. **Execute Function**: The function that is executed when the tool is called

## Implementation in This Server

This server implements the MCP protocol with the following components:

1. **Types** (`src/mcp/types.ts`): TypeScript interfaces for MCP messages
2. **Session Management** (`src/mcp/session.ts`): Functions for creating and managing sessions
3. **Message Handler** (`src/mcp/handler.ts`): Functions for processing MCP messages
4. **Tools** (`src/mcp/tools/`): Implementations of various tools
5. **I/O Handlers** (`src/mcp/io/`): Handlers for standard I/O communication

## Adding Custom Tools

To add a custom tool to the MCP server, create a new file in `src/mcp/tools/` and implement the `MCPTool` interface:

```typescript
import { MCPTool, MCPToolCallPayload, MCPToolResultPayload } from '../types.js';

export const myTool: MCPTool = {
  name: 'my_tool',
  description: 'Description of what my tool does',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter 1'
      },
      param2: {
        type: 'number',
        description: 'Description of parameter 2'
      }
    },
    required: ['param1']
  },
  execute: async (params: MCPToolCallPayload['parameters']): Promise<MCPToolResultPayload['result']> => {
    // Implement your tool logic here
    return {
      // Return the result
    };
  }
};
```

Then register the tool in `src/mcp/index.ts`:

```typescript
import { myTool } from './tools/my-tool.js';

export function initializeMCP(): void {
  // ...
  registerTool(myTool);
  // ...
}
```

## Resources

- [Anthropic MCP Documentation](https://www.anthropic.com/news/model-context-protocol)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api) 