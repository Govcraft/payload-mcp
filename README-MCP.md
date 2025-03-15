# MCP Server for Cursor

This document explains how to use the Model Context Protocol (MCP) server with Cursor.

## Overview

The Model Context Protocol (MCP) is a standardized way for LLM applications to interact with external tools and data. This implementation provides a set of tools that can be used by Cursor and other MCP-compatible clients.

## Available Tools

The MCP server provides the following tools:

1. **echo** - Echoes back the input message
   - Parameters: `message` (string) - The message to echo back

2. **calculate** - Performs basic arithmetic operations
   - Parameters:
     - `operation` (string) - The operation to perform (add, subtract, multiply, divide)
     - `a` (number) - First operand
     - `b` (number) - Second operand

3. **getCurrentDateTime** - Returns the current date and time
   - Parameters: `format` (string, optional) - The format to return (iso, readable)

## How to Use with Cursor

To use the MCP server with Cursor:

1. Run the server in stdio-only mode:
   ```bash
   pnpm start -- --stdio-only
   ```
   or
   ```bash
   pnpm start -- -S
   ```

2. In Cursor, add the MCP server:
   - Click on the MCP Servers button in the sidebar
   - Click "Add new MCP server"
   - Enter a name (e.g., "payload-mcp")
   - Select "sse" as the type
   - Enter the path to your server executable (e.g., `/path/to/payload-mcp/dist/index.js`)
   - Click "Save"

3. The MCP server should now be available in Cursor. You can use the tools by asking Cursor to perform tasks like:
   - "Calculate 5 plus 3"
   - "Echo back 'Hello, world!'"
   - "What's the current date and time?"

## Troubleshooting

If you encounter issues with the MCP server:

1. Make sure you're running the server in stdio-only mode with the `--stdio-only` or `-S` flag
2. Check that the path to the server executable is correct in Cursor
3. Restart Cursor after adding or modifying the MCP server configuration
4. Check the server logs for any error messages

## Development

To add new tools to the MCP server, modify the `src/mcp/anthropic-mcp.ts` file and add new tool definitions using the `server.tool()` method.

Example:
```typescript
server.tool(
  "toolName",
  "Tool description",
  {
    param1: z.string().describe("Parameter description"),
    param2: z.number().describe("Parameter description")
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    return {
      content: [
        {
          type: "text",
          text: "Tool result"
        }
      ]
    };
  }
);
``` 