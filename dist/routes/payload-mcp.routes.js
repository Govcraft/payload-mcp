import { Router } from 'express';
import { handlePayloadMCPRequest, handlePayloadMCPSSEConnection, handlePayloadMCPSSERequest } from '../controllers/payload-mcp.controller.js';
const router = Router();
router.get('/sse', handlePayloadMCPSSEConnection);
router.post('/sse/request', handlePayloadMCPSSERequest);
router.post('/', handlePayloadMCPRequest);
export default router;
//# sourceMappingURL=payload-mcp.routes.js.map