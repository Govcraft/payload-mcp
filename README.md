# Template MCP

A template repository for quickly creating Model Context Protocol (MCP) servers that connect Claude and other AI assistants to external data sources and systems.

## Features

- TypeScript for type safety
- Express.js for API routing
- MCP protocol implementation
- Standard I/O support for command-line integration
- Winston for structured logging
- Helmet for security headers
- CORS support
- Error handling middleware
- Health check endpoint
- Environment-based configuration
- ESLint and Prettier for code quality

## Documentation

For detailed information about the Model Context Protocol and how it's implemented in this server, see the [MCP Protocol Documentation](docs/mcp-protocol.md).

## Using This Template

There are several ways to use this template to create a new MCP server:

### Option 1: Use GitHub's "Use this template" feature

1. Click the "Use this template" button at the top of the repository page
2. Choose "Create a new repository"
3. Follow the prompts to create your new repository
4. Clone your new repository locally
5. Install dependencies with `pnpm install`
6. Start developing with `pnpm dev`

### Option 2: Use the provided script

This repository includes a script to create a new MCP server project:

```bash
# Clone this repository
git clone https://github.com/Govcraft/template-mcp.git

# Make the script executable
chmod +x template-mcp/scripts/create-mcp-server.sh

# Create a new project
./template-mcp/scripts/create-mcp-server.sh my-mcp-project [optional-destination-directory]
```

The script will:
- Clone the template repository
- Initialize a new git repository
- Update package.json with your project name
- Create a .env file from .env.example
- Generate a new README.md
- Install dependencies

### Option 3: Manual clone and setup

1. Clone this repository:
   ```bash
   git clone https://github.com/Govcraft/template-mcp.git my-mcp-project
   cd my-mcp-project
   ```

2. Remove the existing git history and initialize a new repository:
   ```bash
   rm -rf .git
   git init
   ```

3. Update the package.json with your project details:
   ```bash
   # Edit package.json to update name and description
   ```

4. Create a .env file:
   ```bash
   cp .env.example .env
   ```

5. Install dependencies:
   ```bash
   pnpm install
   ```

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

## Development

Start the development server:

```bash
pnpm dev
```

The server will be available at http://localhost:3000 (or the port specified in your `.env` file).

### Standard I/O Mode

The MCP server supports standard I/O mode for command-line interaction. This allows you to send queries through stdin and receive responses through stdout.

#### Enabling Standard I/O Mode

You can enable standard I/O mode in two ways:

1. **Command-line flags**:
   - Use `--stdio` or `-s` to enable standard I/O mode alongside the HTTP server
   - Use `--stdio-only` or `-S` to run in standard I/O mode without starting the HTTP server

2. **Environment variables**:
   - Set `ENABLE_STDIO=true` in your `.env` file to enable standard I/O mode
   - Set `STDIO_ONLY=true` in your `.env` file to run in standard I/O mode without the HTTP server

#### Using Standard I/O Mode

You can send queries to the MCP server through stdin in two formats:

1. **Plain text query**:
   ```bash
   echo "What is 2 + 2?" | pnpm stdio
   ```

2. **JSON MCP request**:
   ```bash
   echo '{"id":"123","type":"request","timestamp":"2023-01-01T00:00:00Z","payload":{"query":"What is 2 + 2?"}}' | pnpm stdio
   ```

The server will automatically exit after processing the input when used with pipes.

## Building for Production

Build the project:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start

# With standard I/O mode
pnpm start --stdio
```

## Project Structure

```
template-mcp/
├── src/                  # Source code
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── mcp/              # Model Context Protocol implementation
│   │   ├── io/           # I/O handlers (stdin/stdout)
│   │   ├── tools/        # MCP tools
│   │   ├── types.ts      # MCP type definitions
│   │   ├── session.ts    # Session management
│   │   ├── handler.ts    # Message handling
│   │   └── index.ts      # MCP initialization
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── scripts/              # Utility scripts
├── dist/                 # Compiled JavaScript
├── logs/                 # Application logs
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Customizing Your MCP Server

### Adding New Tools

To add a new tool to your MCP server:

1. Create a new file in `src/mcp/tools/` (e.g., `src/mcp/tools/weather.ts`)
2. Define your tool following the `MCPTool` interface
3. Register your tool in `src/mcp/index.ts`

Example:

```typescript
// src/mcp/tools/weather.ts
import { MCPTool, MCPToolCallPayload, MCPToolResultPayload } from '../types.js';

export const weatherTool: MCPTool = {
  name: 'weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The location to get weather for'
      }
    },
    required: ['location']
  },
  execute: async (params: MCPToolCallPayload['parameters']): Promise<MCPToolResultPayload['result']> => {
    const { location } = params as { location: string };
    
    // Implement your weather API call here
    
    return {
      temperature: 72,
      conditions: 'sunny',
      location
    };
  }
};

// In src/mcp/index.ts
import { weatherTool } from './tools/weather.js';

export function initializeMCP(): void {
  // ...
  registerTool(calculatorTool);
  registerTool(weatherTool);  // Add your new tool
  // ...
}
```

### Environment Configuration

Customize the `.env` file to configure your server:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# API Configuration
API_PREFIX=/api/v1

# CORS Configuration
CORS_ORIGIN=*

# MCP Configuration
ENABLE_STDIO=false
STDIO_ONLY=false

# Add your custom configuration here
```

## License

ISC