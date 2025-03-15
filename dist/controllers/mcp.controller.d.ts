import { Request, Response } from 'express';
export declare function handleSSEConnection(req: Request, res: Response): Promise<void>;
export declare function handleSSERequest(req: Request, res: Response): Promise<void>;
export declare function handleMCPRequest(req: Request, res: Response): Promise<void>;
export declare function handleToolCall(req: Request, res: Response): Promise<void>;
export declare function getTools(_req: Request, res: Response): void;
export declare function handleSSEToolCall(req: Request, res: Response): Promise<void>;
