#!/bin/bash

# Check if a project name was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <project-name> [destination-directory]"
  exit 1
fi

PROJECT_NAME=$1
DEST_DIR=${2:-$(pwd)}
TEMPLATE_REPO="https://github.com/Govcraft/template-mcp.git"

# Create project directory
FULL_PATH="$DEST_DIR/$PROJECT_NAME"
echo "Creating new MCP server project: $PROJECT_NAME at $FULL_PATH"

# Clone the template repository
git clone $TEMPLATE_REPO "$FULL_PATH"
cd "$FULL_PATH"

# Remove the .git directory to start fresh
rm -rf .git

# Initialize a new git repository
git init

# Update package.json with the new project name
sed -i "s/\"name\": \"template-mcp\"/\"name\": \"$PROJECT_NAME\"/" package.json
sed -i "s/\"description\": \"Template for creating Model Context Protocol (MCP) Servers for connecting Claude to external data sources\"/\"description\": \"$PROJECT_NAME - Model Context Protocol (MCP) Server\"/" package.json

# Create a fresh .env file from the example
cp .env.example .env

# Update README.md
echo "# $PROJECT_NAME

A Model Context Protocol (MCP) Server based on the payload-mcp template.

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

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

## Installation

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Configure environment variables in \`.env\` file

## Development

Start the development server:

\`\`\`bash
pnpm dev
\`\`\`

The server will be available at http://localhost:3000 (or the port specified in your \`.env\` file).

### Standard I/O Mode

The MCP server supports standard I/O mode for command-line interaction:

\`\`\`bash
# Run with HTTP server and stdio support
pnpm dev --stdio

# Run in stdio-only mode (no HTTP server)
pnpm stdio
\`\`\`

## Building for Production

\`\`\`bash
pnpm build
pnpm start
\`\`\`
" > README.md

# Install dependencies
echo "Installing dependencies..."
pnpm install

echo "✅ MCP server project '$PROJECT_NAME' created successfully at $FULL_PATH"
echo "Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. Update the .env file with your configuration"
echo "  3. Start developing with 'pnpm dev'" 