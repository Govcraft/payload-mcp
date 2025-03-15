export const notFoundHandler = (req, _res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    error.status = 'fail';
    error.isOperational = true;
    next(error);
};
//# sourceMappingURL=notFoundHandler.js.map