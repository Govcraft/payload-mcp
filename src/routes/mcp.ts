import express, { Router } from 'express';
import { handleMCPRequest, handleToolCall, getTools } from '../controllers/mcp.controller.js';

const router: Router = express.Router();

/**
 * @route   POST /api/v1/mcp/request
 * @desc    Handle MCP request
 * @access  Public
 */
router.post('/request', handleMCPRequest);

/**
 * @route   POST /api/v1/mcp/tool
 * @desc    Handle tool call
 * @access  Public
 */
router.post('/tool', handleToolCall);

/**
 * @route   GET /api/v1/mcp/tools
 * @desc    Get available tools
 * @access  Public
 */
router.get('/tools', getTools);

export const mcpRoutes: Router = router; 