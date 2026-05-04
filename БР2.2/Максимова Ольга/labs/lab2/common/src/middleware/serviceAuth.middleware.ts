import { Request, Response, NextFunction } from 'express';
import settings from '../config/config';

export const serviceAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) !== settings.SERVICE_TOKEN) {
    res.status(401).json({ message: 'Invalid service token' });
    return;
  }

  next();
};