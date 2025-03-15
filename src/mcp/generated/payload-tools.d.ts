
/**
 * Auto-generated Payload CMS tools for MCP
 */

/**
 * Tool interface matching the SDK requirements
 */
export interface PayloadTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  template: string;
}

export const payloadTools: PayloadTool[];

/**
 * Map of tool names to tool definitions
 */
export interface PayloadToolsMap {
  tools: Record<string, PayloadTool>;
}

/**
 * For backward compatibility
 */
export const toolsMap: Record<string, PayloadTool>;
