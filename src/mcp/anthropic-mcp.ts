import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from '../utils/logger.js';
import { payloadTools } from './generated/payload-tools.js';

// Define types for the tool schema
interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
}

// Define the tool interface
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, SchemaProperty>;
    required?: string[];
  };
  template?: string;
}

// Create server instance
const server = new McpServer({
  name: "payload-mcp",
  version: "1.0.0",
});

// Register Payload CMS tools
function registerPayloadTools() {
  logger.info(`Registering ${payloadTools.length} Payload CMS tools...`);
  
  // Register all tools from the payloadTools array
  registerToolsArray(payloadTools);
}

// Helper function to register an array of tools
function registerToolsArray(toolsArray: any[]) {
  // Get all tools from the array
  for (const tool of toolsArray) {
    try {
      // Convert the inputSchema to Zod schema
      const params: Record<string, any> = {};
      
      if (tool.parameters && tool.parameters.properties) {
        for (const [key, propValue] of Object.entries(tool.parameters.properties)) {
          // Cast to SchemaProperty to ensure type safety
          const prop = propValue as SchemaProperty;
          
          // Basic type conversion from JSON Schema to Zod
          if (prop.type === 'string') {
            if (prop.enum) {
              params[key] = z.enum(prop.enum as [string, ...string[]]).describe(prop.description || '');
            } else {
              params[key] = z.string().describe(prop.description || '');
            }
          } else if (prop.type === 'number') {
            params[key] = z.number().describe(prop.description || '');
          } else if (prop.type === 'boolean') {
            params[key] = z.boolean().describe(prop.description || '');
          } else if (prop.type === 'array') {
            params[key] = z.array(z.any()).describe(prop.description || '');
          } else if (prop.type === 'object') {
            params[key] = z.record(z.any()).describe(prop.description || '');
          } else {
            params[key] = z.any().describe(prop.description || '');
          }
        }
      }
      
      // Register the tool with the server - using the correct signature
      server.tool(
        tool.name,
        params,  // Parameters schema directly as the second argument
        async (parameters: Record<string, any>) => {
          try {
            logger.verbose(`Executing Payload tool: ${tool.name}`);
            
            // For now, just return a template with the parameters
            const template = (tool as Tool).template || "{}";
            
            // Replace placeholders in the template
            let result = template;
            for (const [key, value] of Object.entries(parameters)) {
              result = result.replace(new RegExp('{' + key + '}', 'g'), String(value));
            }
            
            // Replace any remaining placeholders with defaults
            result = result.replace(/{([^}]+)}/g, '');
            
            return {
              content: [
                {
                  type: "text",
                  text: result
                }
              ]
            };
          } catch (error) {
            logger.error(`Error executing Payload tool ${tool.name}`, { error });
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Error executing tool ${tool.name}: ${error instanceof Error ? error.message : String(error)}`
                }
              ]
            };
          }
        }
      );
      
      logger.verbose(`Registered Payload CMS tool: ${tool.name}`);
    } catch (error) {
      logger.error(`Failed to register tool ${tool.name}:`, { error });
    }
  }
  
  logger.info(`Registered ${toolsArray.length} Payload CMS tools`);
}

export function initializeAnthropicMCP() {
  logger.info('Initializing Anthropic MCP server...');
  
  // Register tools
  registerPayloadTools();
  
  logger.info('Anthropic MCP server initialized');
  
  return server;
}

// Run the server with stdio transport
export async function runMCPServer() {
  logger.info('Starting MCP server with stdio transport...');
  
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    
    // Log detailed connection information
    const serverInfo = {
      name: "payload-mcp",
      version: "1.0.0",
      mode: 'stdio',
      transport: 'StdioServerTransport',
      startTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform
    };
    
    // Log detailed server information to files only
    logger.info('MCP server started successfully', { serverInfo });
    logger.info('Connection mode: stdio (Standard Input/Output)');
    logger.info(`Server is ready to process requests via stdin/stdout`);
  } catch (error) {
    logger.error('Error connecting MCP server:', { error });
    throw error; // Re-throw to be caught by the caller
  }
} 