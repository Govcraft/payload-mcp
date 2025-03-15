import express from 'express';
import os from 'os';
const router = express.Router();
router.get('/', (_req, res) => {
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
export const healthRoutes = router;
//# sourceMappingURL=health.js.map