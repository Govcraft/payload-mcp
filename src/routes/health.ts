import express, { Request, Response, Router } from 'express';
import os from 'os';

const router: Router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (_req: Request, res: Response): void => {
  const healthcheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    hostname: os.hostname(),
    memory: process.memoryUsage(),
    cpu: os.cpus(),
    platform: process.platform,
    nodeVersion: process.version,
  };

  res.status(200).json(healthcheck);
});

export const healthRoutes: Router = router; 