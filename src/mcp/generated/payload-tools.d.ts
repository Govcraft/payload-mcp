
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
 * Default export for JSON import
 */
declare const toolsJson: PayloadToolsMap;
export default toolsJson;
