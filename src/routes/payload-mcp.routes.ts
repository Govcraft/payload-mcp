import { Router } from 'express';
import { handlePayloadMCPRequest } from '../controllers/payload-mcp.controller.js';

const router: Router = Router();

/**
 * @route POST /api/v1/payload-mcp
 * @desc Handle MCP requests for Payload CMS
 * @access Public
 */
router.post('/', handlePayloadMCPRequest);

export default router; 