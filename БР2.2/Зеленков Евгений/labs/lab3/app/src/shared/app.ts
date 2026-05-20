import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { errorHandler, HttpError, notFoundHandler } from './errors';

export function createServiceApp() {
  const app = express();

  app.use(express.json());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header('x-request-id') ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

export function mountErrorHandlers(app: express.Express) {
  app.use(notFoundHandler);
  app.use(errorHandler);
}

export function assertFound<T>(value: T | null | undefined, code: string, message: string): T {
  if (!value) throw new HttpError(404, code, message);
  return value;
}
