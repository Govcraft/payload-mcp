import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  error.status = 'fail';
  error.isOperational = true;
  next(error);
}; 