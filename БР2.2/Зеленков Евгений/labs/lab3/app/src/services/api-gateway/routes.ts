import { Router, Request, Response, NextFunction } from 'express';
import { authRequired } from '../../shared/auth';
import { config } from '../../shared/config';
import { HttpError } from '../../shared/errors';
import { downstreamHeaders } from '../../shared/http-client';

export const gatewayRouter = Router();

function requiresAuth(req: Request): boolean {
  if (req.path === '/auth/register' || req.path === '/auth/login') return false;
  if (req.method !== 'GET') return true;
  return req.path.startsWith('/users') || req.path.startsWith('/reservations');
}

function authIfNeeded(req: Request, res: Response, next: NextFunction) {
  if (!requiresAuth(req)) return next();
  return authRequired(req, res, next);
}

function targetFor(path: string): string {
  if (path.startsWith('/auth') || path.startsWith('/users')) return config.services.identity;
  if (path.startsWith('/reservations')) return config.services.reservation;
  if (path.startsWith('/reviews')) return config.services.review;
  if (path.includes('/reviews')) return config.services.review;
  if (path.startsWith('/menus') || path.startsWith('/menu-items') || path.includes('/menus')) return config.services.menu;
  if (path.startsWith('/restaurants')) return config.services.catalog;
  throw new HttpError(404, 'route_not_found', 'Route not found');
}

gatewayRouter.use(authIfNeeded);

gatewayRouter.use(async (req, res, next) => {
  try {
    const target = targetFor(req.path);
    const response = await fetch(`${target}/api/v1${req.path}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`, {
      method: req.method,
      headers: {
        ...downstreamHeaders(req.requestId, req.user?.id, req.user?.role),
        Accept: 'application/json',
        ...(req.body && Object.keys(req.body).length > 0 ? { 'Content-Type': 'application/json' } : {})
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {})
    });

    const text = await response.text();
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'content-type') res.setHeader(key, value);
    }
    if (!text) return res.send();
    return res.send(text);
  } catch (error) {
    next(error);
  }
});
