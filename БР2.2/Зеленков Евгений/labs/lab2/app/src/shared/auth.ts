import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from './config';
import { Role } from './enums';
import { HttpError } from './errors';

export type AuthUser = {
  id: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret);
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as JwtPayload).id !== 'string' ||
    !Object.values(Role).includes((payload as JwtPayload).role as Role)
  ) {
    throw new HttpError(401, 'unauthorized', 'Invalid token payload');
  }

  return { id: (payload as JwtPayload).id as string, role: (payload as JwtPayload).role as Role };
}

function authFromGateway(req: Request): AuthUser | null {
  const userId = req.header('x-user-id');
  const userRole = req.header('x-user-role');

  if (!userId && !userRole) return null;
  if (req.header('x-service-token') !== config.serviceToken) {
    throw new HttpError(401, 'unauthorized', 'Invalid service token');
  }
  if (!userId || !Object.values(Role).includes(userRole as Role)) {
    throw new HttpError(401, 'unauthorized', 'Invalid gateway user headers');
  }

  return { id: userId, role: userRole as Role };
}

function authFromJwt(req: Request): AuthUser | null {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return verifyToken(header.slice('Bearer '.length));
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = authFromGateway(req) ?? authFromJwt(req);
    if (!user) throw new HttpError(401, 'unauthorized', 'Authorization token is required');
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = authFromGateway(req) ?? authFromJwt(req) ?? undefined;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function adminRequired(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== Role.Admin) {
    return next(new HttpError(403, 'forbidden', 'Admin role is required'));
  }
  return next();
}

export function serviceTokenRequired(req: Request, _res: Response, next: NextFunction) {
  if (req.header('x-service-token') !== config.serviceToken) {
    return next(new HttpError(401, 'unauthorized', 'Service token is required'));
  }
  return next();
}
