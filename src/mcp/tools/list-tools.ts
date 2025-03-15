import { MCPTool } from '../types.js';
import { getAvailableTools } from '../handler.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool to list all available tools
 * This helps the LLM know what tools are available for use
 */
export const listToolsTool: MCPTool = {
  name: 'listTools',
  description: 'Lists all available tools with their descriptions and parameters',
  parameters: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        description: 'Optional filter to search for specific tools by name or description'
      },
      includeParameters: {
        type: 'boolean',
        description: 'Whether to include parameter details in the response'
      }
    }
  },
  handler: async (params: Record<string, unknown>): Promise<unknown> => {
    try {
      const filter = params.filter as string | undefined;
      const includeParameters = params.includeParameters as boolean | undefined;
      
      // Get all available tools
      const tools = getAvailableTools();
      
      // Filter tools if a filter is provided
      const filteredTools = filter 
        ? tools.filter(tool => 
            tool.name.toLowerCase().includes(filter.toLowerCase()) || 
            tool.description.toLowerCase().includes(filter.toLowerCase())
          )
        : tools;
      
      // Format the response
      const result = filteredTools.map(tool => {
        const toolInfo: Record<string, unknown> = {
          name: tool.name,
          description: tool.description
        };
        
        // Include parameters if requested
        if (includeParameters) {
          toolInfo.parameters = tool.parameters;
        }
        
        return toolInfo;
      });
      
      logger.info(`Listed ${result.length} tools${filter ? ` matching filter: ${filter}` : ''}`);
      return result;
    } catch (error) {
      logger.error('Error listing tools', { error });
      throw new Error(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 