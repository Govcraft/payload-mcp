import { getAvailableTools } from '../handler.js';
import { logger } from '../../utils/logger.js';
export const listToolsTool = {
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
    handler: async (params) => {
        try {
            const filter = params.filter;
            const includeParameters = params.includeParameters;
            const tools = getAvailableTools();
            const filteredTools = filter
                ? tools.filter(tool => tool.name.toLowerCase().includes(filter.toLowerCase()) ||
                    tool.description.toLowerCase().includes(filter.toLowerCase()))
                : tools;
            const result = filteredTools.map(tool => {
                const toolInfo = {
                    name: tool.name,
                    description: tool.description
                };
                if (includeParameters) {
                    toolInfo.inputSchema = tool.parameters;
                }
                return toolInfo;
            });
            logger.info(`Listed ${result.length} tools${filter ? ` matching filter: ${filter}` : ''}`);
            return result;
        }
        catch (error) {
            logger.error('Error listing tools', { error });
            throw new Error(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
//# sourceMappingURL=list-tools.js.map