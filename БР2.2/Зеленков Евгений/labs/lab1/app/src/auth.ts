import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { Role } from './entities';
import { HttpError } from './http';

export type AuthUser = {
  id: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'unauthorized', 'Authorization token is required'));
  }

  try {
    req.user = jwt.verify(header.slice('Bearer '.length), config.jwtSecret) as AuthUser;
    return next();
  } catch {
    return next(new HttpError(401, 'unauthorized', 'Invalid authorization token'));
  }
}

export function adminRequired(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== Role.Admin) {
    return next(new HttpError(403, 'forbidden', 'Admin role is required'));
  }
  return next();
}
