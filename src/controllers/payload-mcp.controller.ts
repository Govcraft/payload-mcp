import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { payloadTools } from '../mcp/generated/payload-tools.js';
import { tools as customTools } from '../mcp/tools/index.js';

/**
 * Handle MCP requests for Payload CMS
 */
export async function handlePayloadMCPRequest(req: Request, res: Response): Promise<void> {
  try {
    const { model, tools, context = [] } = req.body;
    
    logger.debug('Received Payload MCP request', { model, toolsCount: tools?.length });
    
    // Create a map of available tools for quick lookup
    const allTools = [...payloadTools, ...customTools];
    const toolsMap = allTools.reduce((acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    }, {} as Record<string, typeof payloadTools[0]>);
    
    // Process the request
    const toolResults = [];
    
    if (tools && Array.isArray(tools)) {
      for (const tool of tools) {
        const { name, parameters } = tool;
        
        // Check if the tool exists
        if (!toolsMap[name]) {
          logger.warn(`Tool not found: ${name}`);
          toolResults.push({
            tool_name: name,
            output: { error: `Tool not found: ${name}` }
          });
          continue;
        }
        
        // Execute the tool
        logger.debug(`Executing tool: ${name}`, { parameters });
        
        try {
          // Call the tool's handler
          const result = await toolsMap[name].handler(parameters);
          
          toolResults.push({
            tool_name: name,
            output: result
          });
          
          // Add the result to the context
          context.push({
            id: uuidv4(),
            data: result
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error executing tool: ${name}`, { error, parameters });
          toolResults.push({
            tool_name: name,
            output: { error: `Error executing tool: ${errorMessage}` }
          });
        }
      }
    }
    
    // Return the response
    const response = {
      id: uuidv4(),
      context,
      tool_results: toolResults.length > 0 ? toolResults : undefined
    };
    
    res.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error handling Payload MCP request', { error });
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
} 