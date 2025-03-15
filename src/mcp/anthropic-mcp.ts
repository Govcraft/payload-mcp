import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from '../utils/logger.js';
import { payloadTools } from './generated/payload-tools.js';
// Import the tools JSON directly to compare
import toolsJson from './generated/payload-tools.json' with { type: 'json' };

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
  // Compare the payloadTools array with the direct JSON import
  const jsonToolsCount = Object.keys(toolsJson.tools).length;
  logger.info(`JSON tools count: ${jsonToolsCount}, payloadTools count: ${payloadTools.length}`);
  
  if (jsonToolsCount !== payloadTools.length) {
    logger.warn(`Mismatch between JSON tools (${jsonToolsCount}) and payloadTools (${payloadTools.length})`);
    
    // If there's a mismatch, use the tools directly from the JSON
    const directTools = Object.values(toolsJson.tools).map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
      template: tool.template
    }));
    
    logger.info(`Using ${directTools.length} tools directly from JSON`);
    registerToolsArray(directTools);
  } else {
    logger.info(`Registering ${payloadTools.length} Payload CMS tools...`);
    
    // Log the names of all tools in the payloadTools array
    logger.info(`payloadTools contains: ${payloadTools.map(t => t.name).join(', ')}`);
    
    registerToolsArray(payloadTools);
  }
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
      
      // Register the tool with the server
      server.tool(
        tool.name,
        tool.description,
        params,
        async (parameters: Record<string, any>) => {
          try {
            logger.info(`Executing Payload tool: ${tool.name}`);
            
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
      
      logger.info(`Registered Payload CMS tool: ${tool.name}`);
    } catch (error) {
      logger.error(`Failed to register tool ${tool.name}:`, { error });
    }
  }
  
  logger.info(`Registered ${toolsArray.length} Payload CMS tools`);
}

// Register the listTools tool
function registerListToolsTool() {
  logger.info('Registering listTools tool...');
  
  server.tool(
    "listTools",
    "Lists all available tools with their descriptions and parameters",
    {
      filter: z.string().optional().describe("Optional filter to search for specific tools by name or description"),
      includeParameters: z.boolean().optional().describe("Whether to include parameter details in the response"),
      page: z.number().optional().describe("Page number for pagination (starts at 1)"),
      pageSize: z.number().optional().describe("Number of tools per page (default: 10)")
    },
    async ({ filter, includeParameters, page = 1, pageSize = 10 }: { 
      filter?: string; 
      includeParameters?: boolean;
      page?: number;
      pageSize?: number;
    }) => {
      try {
        // Get all registered tools - using any type since we don't have the exact SDK type
        const tools = (server as any).getTools() || [];
        logger.info(`listTools: Found ${tools.length} tools registered with the server`);
        
        // Log the names of all tools for debugging
        logger.info(`listTools: Tool names: ${tools.map((t: Tool) => t.name).join(', ')}`);
        
        // Filter tools if a filter is provided
        const filteredTools = filter 
          ? tools.filter((tool: Tool) => 
              tool.name.toLowerCase().includes(filter.toLowerCase()) || 
              tool.description.toLowerCase().includes(filter.toLowerCase())
            )
          : tools;
        
        // Apply pagination
        const totalTools = filteredTools.length;
        const totalPages = Math.ceil(totalTools / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalTools);
        const paginatedTools = filteredTools.slice(startIndex, endIndex);
        
        // Format the response
        const result = {
          tools: paginatedTools.map((tool: Tool) => {
            const toolInfo: Record<string, unknown> = {
              name: tool.name,
              description: tool.description
            };
            
            // Include parameters if requested
            if (includeParameters) {
              toolInfo.parameters = tool.parameters;
            }
            
            return toolInfo;
          }),
          pagination: {
            page,
            pageSize,
            totalTools,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
        
        logger.info(`Listed ${paginatedTools.length} tools (page ${page}/${totalPages})${filter ? ` matching filter: ${filter}` : ''}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error listing tools', { error });
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error listing tools: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  logger.info('Registered listTools tool');
}

export function initializeAnthropicMCP() {
  logger.info('Initializing Anthropic MCP server...');
  
  // Register tools
  registerPayloadTools();
  registerListToolsTool();
  
  // Log the number of tools registered with the server
  const toolCount = (server as any).getTools?.() ? (server as any).getTools().length : 'unknown';
  logger.info(`Total tools registered with server: ${toolCount}`);
  
  logger.info('Anthropic MCP server initialized');
  
  return server;
}

// Run the server with stdio transport
export async function runMCPServer() {
  logger.info('Starting MCP server with stdio transport...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('MCP server started');
} 