# Payload MCP

A Model Context Protocol (MCP) server for Payload CMS 3.0 that auto-generates tools from Payload's TypeScript type definitions.

## Features

- Auto-generates MCP tools from Payload CMS 3.0 TypeScript definitions
- Provides an HTTP endpoint for LLMs to generate up-to-date Payload code
- Bridges the gap between LLM training cutoff and current Payload CMS API
- Supports all major Payload CMS features:
  - Collections
  - Globals
  - Fields
  - Authentication
  - Configuration

## How It Works

1. **Parse Type Definitions**: Uses ts-morph to analyze Payload's .d.ts files
2. **Generate Tools**: Converts types into MCP tools with parameters and code-gen logic
3. **Serve Endpoint**: Provides an /api/v1/payload-mcp endpoint for LLMs to query
4. **Generate Code**: Returns properly formatted Payload CMS 3.0 code

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/payload-mcp.git
cd payload-mcp

# Install dependencies
pnpm install

# Generate tools from Payload CMS type definitions
pnpm generate-tools

# Start the development server
pnpm dev
```

### Usage

The MCP server exposes an endpoint at `/api/v1/payload-mcp` that accepts POST requests with the following structure:

```json
{
  "model": "claude-3-opus-20240229",
  "tools": [
    {
      "name": "createCollection",
      "parameters": {
        "slug": "posts",
        "fields": [
          {
            "name": "title",
            "type": "text",
            "required": true
          }
        ],
        "admin": {
          "useAsTitle": "title"
        }
      }
    }
  ]
}
```

The server will respond with generated Payload CMS 3.0 code:

```json
{
  "id": "uuid",
  "context": [
    {
      "id": "uuid",
      "data": {
        "code": "import { CollectionConfig } from 'payload/types';\n\nexport const postsCollection: CollectionConfig = {\n  slug: 'posts',\n  fields: [\n  {\n    \"name\": \"title\",\n    \"type\": \"text\",\n    \"required\": true\n  }\n],\n  // Add other properties as needed from params\n  ...{\n  \"admin\": {\n    \"useAsTitle\": \"title\"\n  }\n}\n};\n",
        "message": "Collection 'posts' created successfully"
      }
    }
  ],
  "tool_results": [
    {
      "tool_name": "createCollection",
      "output": {
        "code": "import { CollectionConfig } from 'payload/types';\n\nexport const postsCollection: CollectionConfig = {\n  slug: 'posts',\n  fields: [\n  {\n    \"name\": \"title\",\n    \"type\": \"text\",\n    \"required\": true\n  }\n],\n  // Add other properties as needed from params\n  ...{\n  \"admin\": {\n    \"useAsTitle\": \"title\"\n  }\n}\n};\n",
        "message": "Collection 'posts' created successfully"
      }
    }
  ]
}
```

## Available Tools

The following tools are auto-generated from Payload CMS 3.0 type definitions:

- **createCollection**: Creates a collection configuration
- **createGlobal**: Creates a global configuration
- **createField**: Creates a field configuration
- **createAuth**: Creates authentication configuration
- **createConfig**: Creates the main Payload CMS configuration

## Development

### Regenerating Tools

If you update Payload CMS or want to regenerate the tools:

```bash
# Update Payload
pnpm add payload@latest

# Regenerate tools
pnpm generate-tools
```

### Logging

The server uses Winston for logging. By default, logs are written to the `logs` directory with the following files:

- `combined.log`: All logs (info level and above)
- `error.log`: Error logs only
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled promise rejections

The server uses npm logging levels (from highest to lowest priority):
```
error: 0,
warn: 1,
info: 2,
http: 3,
verbose: 4,
debug: 5,
silly: 6
```

By default, the log level is set to `info`, which means only logs with level `info`, `warn`, and `error` will be recorded. To see more detailed logs:

- Set to `verbose` to see tool registration details
- Set to `debug` for even more detailed debugging information
- Set to `silly` for the most verbose output

You can change the log level by setting the `LOG_LEVEL` environment variable:

```bash
# Run with verbose logging (shows tool registration)
LOG_LEVEL=verbose pnpm start

# Run with debug logging (more detailed)
LOG_LEVEL=debug pnpm start

# Or set in .env file
# LOG_LEVEL=verbose
```

### Testing

To test the auto-generated tools:

```bash
# Start the server
pnpm dev

# In another terminal, run the test script
node test-generated-tools.mjs
```

## License

ISC
