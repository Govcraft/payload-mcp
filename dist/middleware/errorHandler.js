import { logger } from '../utils/logger.js';
export const errorHandler = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
        stack: err.stack,
        user: req.user || 'unauthenticated',
        body: req.body,
        params: req.params,
    });
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        logger.error('An unexpected error occurred', { error: err });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
};
//# sourceMappingURL=errorHandler.js.map