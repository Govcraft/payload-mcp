import { MCPTool } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * A simple calculator tool for demonstration purposes
 */
export const calculatorTool: MCPTool = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform'
      },
      a: {
        type: 'number',
        description: 'The first operand'
      },
      b: {
        type: 'number',
        description: 'The second operand'
      }
    },
    required: ['operation', 'a', 'b']
  },
  handler: async (params: Record<string, unknown>): Promise<unknown> => {
    try {
      // Extract and validate parameters
      const operation = params.operation as string;
      const a = params.a as number;
      const b = params.b as number;
      
      // Validate parameters
      if (
        !['add', 'subtract', 'multiply', 'divide'].includes(operation) ||
        typeof a !== 'number' ||
        typeof b !== 'number'
      ) {
        throw new Error('Invalid parameters for calculator tool');
      }
      
      logger.debug('Calculator tool called', { operation, a, b });
      
      let result: number;
      
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            throw new Error('Division by zero');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        result,
        operation,
        a,
        b
      };
    } catch (error) {
      logger.error('Error in calculator tool', { error, params });
      throw error;
    }
  }
}; 