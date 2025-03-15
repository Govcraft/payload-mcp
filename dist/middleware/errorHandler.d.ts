import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
declare global {
    namespace Express {
        interface Request {
            user?: Record<string, any>;
        }
    }
}
export declare const errorHandler: (err: AppError, req: Request, res: Response, _next: NextFunction) => void;
