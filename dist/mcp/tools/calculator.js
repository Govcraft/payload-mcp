import { logger } from '../../utils/logger.js';
export const calculatorTool = {
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
    handler: async (params) => {
        try {
            const operation = params.operation;
            const a = params.a;
            const b = params.b;
            if (!['add', 'subtract', 'multiply', 'divide'].includes(operation) ||
                typeof a !== 'number' ||
                typeof b !== 'number') {
                throw new Error('Invalid parameters for calculator tool');
            }
            logger.debug('Calculator tool called', { operation, a, b });
            let result;
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
        }
        catch (error) {
            logger.error('Error in calculator tool', { error, params });
            throw error;
        }
    }
};
//# sourceMappingURL=calculator.js.map