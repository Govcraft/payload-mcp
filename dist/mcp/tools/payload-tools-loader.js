import { existsSync } from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';
export function loadPayloadTools() {
    const tools = [];
    const generatedDir = path.join(process.cwd(), 'src', 'mcp', 'generated');
    const toolsFile = path.join(generatedDir, 'payload-tools.ts');
    if (!existsSync(toolsFile)) {
        logger.warn('Payload CMS tools not found. Run "pnpm generate-tools" to generate them.');
        return tools;
    }
    try {
        logger.info('Payload CMS tools found and will be loaded during initialization');
        return tools;
    }
    catch (error) {
        logger.error('Error loading Payload CMS tools', { error });
        return tools;
    }
}
//# sourceMappingURL=payload-tools-loader.js.map