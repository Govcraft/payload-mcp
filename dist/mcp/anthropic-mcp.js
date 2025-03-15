import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from '../utils/logger.js';
import { payloadTools } from './generated/payload-tools.js';
const server = new McpServer({
    name: "payload-mcp",
    version: "1.0.0",
});
function registerPayloadTools() {
    logger.info(`Registering ${payloadTools.length} Payload CMS tools...`);
    registerToolsArray(payloadTools);
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
            server.tool(tool.name, params, async (parameters) => {
                try {
                    logger.verbose(`Executing Payload tool: ${tool.name}`);
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
            logger.verbose(`Registered Payload CMS tool: ${tool.name}`);
        }
        catch (error) {
            logger.error(`Failed to register tool ${tool.name}:`, { error });
        }
    }
    logger.info(`Registered ${toolsArray.length} Payload CMS tools`);
}
export function initializeAnthropicMCP() {
    logger.info('Initializing Anthropic MCP server...');
    registerPayloadTools();
    logger.info('Anthropic MCP server initialized');
    return server;
}
export async function runMCPServer() {
    logger.info('Starting MCP server with stdio transport...');
    const transport = new StdioServerTransport();
    try {
        await server.connect(transport);
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
        logger.info('MCP server started successfully', { serverInfo });
        logger.info('Connection mode: stdio (Standard Input/Output)');
        logger.info(`Server is ready to process requests via stdin/stdout`);
    }
    catch (error) {
        logger.error('Error connecting MCP server:', { error });
        throw error;
    }
}
//# sourceMappingURL=anthropic-mcp.js.map