import { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function sendError(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ code: error.code, message: error.message });
  }

  console.error(error);
  return res.status(500).json({ code: 'internal_error', message: 'Internal server error' });
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'route_not_found', 'Route not found'));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  sendError(res, error);
}
