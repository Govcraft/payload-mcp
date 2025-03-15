import express from 'express';
import { handleMCPRequest, handleToolCall, getTools, handleSSEConnection, handleSSERequest, handleSSEToolCall } from '../controllers/mcp.controller.js';
const router = express.Router();
router.get('/sse', handleSSEConnection);
router.post('/sse/request', handleSSERequest);
router.post('/sse/tool', handleSSEToolCall);
router.post('/request', handleMCPRequest);
router.post('/tool', handleToolCall);
router.get('/tools', getTools);
export const mcpRoutes = router;
//# sourceMappingURL=mcp.js.map