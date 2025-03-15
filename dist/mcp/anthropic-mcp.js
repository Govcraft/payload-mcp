import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from '../utils/logger.js';
import { payloadTools } from './generated/payload-tools.js';
import toolsJson from './generated/payload-tools.json' with { type: 'json' };
const server = new McpServer({
    name: "payload-mcp",
    version: "1.0.0",
});
function registerPayloadTools() {
    const jsonToolsCount = Object.keys(toolsJson.tools).length;
    logger.info(`JSON tools count: ${jsonToolsCount}, payloadTools count: ${payloadTools.length}`);
    if (jsonToolsCount !== payloadTools.length) {
        logger.warn(`Mismatch between JSON tools (${jsonToolsCount}) and payloadTools (${payloadTools.length})`);
        const directTools = Object.values(toolsJson.tools).map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
            template: tool.template
        }));
        logger.info(`Using ${directTools.length} tools directly from JSON`);
        registerToolsArray(directTools);
    }
    else {
        logger.info(`Registering ${payloadTools.length} Payload CMS tools...`);
        logger.info(`payloadTools contains: ${payloadTools.map(t => t.name).join(', ')}`);
        registerToolsArray(payloadTools);
    }
}
function registerToolsArray(toolsArray) {
    for (const tool of toolsArray) {
        try {
            const params = {};
            if (tool.parameters && tool.parameters.properties) {
                for (const [key, propValue] of Object.entries(tool.parameters.properties)) {
                    const prop = propValue;
                    if (prop.type === 'string') {
                        if (prop.enum) {
                            params[key] = z.enum(prop.enum).describe(prop.description || '');
                        }
                        else {
                            params[key] = z.string().describe(prop.description || '');
                        }
                    }
                    else if (prop.type === 'number') {
                        params[key] = z.number().describe(prop.description || '');
                    }
                    else if (prop.type === 'boolean') {
                        params[key] = z.boolean().describe(prop.description || '');
                    }
                    else if (prop.type === 'array') {
                        params[key] = z.array(z.any()).describe(prop.description || '');
                    }
                    else if (prop.type === 'object') {
                        params[key] = z.record(z.any()).describe(prop.description || '');
                    }
                    else {
                        params[key] = z.any().describe(prop.description || '');
                    }
                }
            }
            server.tool(tool.name, tool.description, params, async (parameters) => {
                try {
                    logger.info(`Executing Payload tool: ${tool.name}`);
                    const template = tool.template || "{}";
                    let result = template;
                    for (const [key, value] of Object.entries(parameters)) {
                        result = result.replace(new RegExp('{' + key + '}', 'g'), String(value));
                    }
                    result = result.replace(/{([^}]+)}/g, '');
                    return {
                        content: [
                            {
                                type: "text",
                                text: result
                            }
                        ]
                    };
                }
                catch (error) {
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
            });
            logger.info(`Registered Payload CMS tool: ${tool.name}`);
        }
        catch (error) {
            logger.error(`Failed to register tool ${tool.name}:`, { error });
        }
    }
    logger.info(`Registered ${toolsArray.length} Payload CMS tools`);
}
function registerListToolsTool() {
    logger.info('Registering listTools tool...');
    server.tool("listTools", "Lists all available tools with their descriptions and parameters", {
        filter: z.string().optional().describe("Optional filter to search for specific tools by name or description"),
        includeParameters: z.boolean().optional().describe("Whether to include parameter details in the response"),
        page: z.number().optional().describe("Page number for pagination (starts at 1)"),
        pageSize: z.number().optional().describe("Number of tools per page (default: 10)")
    }, async ({ filter, includeParameters, page = 1, pageSize = 10 }) => {
        try {
            const tools = server.getTools() || [];
            logger.info(`listTools: Found ${tools.length} tools registered with the server`);
            logger.info(`listTools: Tool names: ${tools.map((t) => t.name).join(', ')}`);
            const filteredTools = filter
                ? tools.filter((tool) => tool.name.toLowerCase().includes(filter.toLowerCase()) ||
                    tool.description.toLowerCase().includes(filter.toLowerCase()))
                : tools;
            const totalTools = filteredTools.length;
            const totalPages = Math.ceil(totalTools / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, totalTools);
            const paginatedTools = filteredTools.slice(startIndex, endIndex);
            const result = {
                tools: paginatedTools.map((tool) => {
                    const toolInfo = {
                        name: tool.name,
                        description: tool.description
                    };
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
        }
        catch (error) {
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
    });
    logger.info('Registered listTools tool');
}
export function initializeAnthropicMCP() {
    logger.info('Initializing Anthropic MCP server...');
    registerPayloadTools();
    registerListToolsTool();
    const toolCount = server.getTools?.() ? server.getTools().length : 'unknown';
    logger.info(`Total tools registered with server: ${toolCount}`);
    logger.info('Anthropic MCP server initialized');
    return server;
}
export async function runMCPServer() {
    logger.info('Starting MCP server with stdio transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server started');
}
//# sourceMappingURL=anthropic-mcp.js.map