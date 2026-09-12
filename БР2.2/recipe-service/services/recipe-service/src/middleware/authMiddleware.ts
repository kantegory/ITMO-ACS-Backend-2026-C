import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

// Для эндпоинтов, где авторизация обязательна (BearerAuth в схеме API)
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new AppError('Требуется авторизация (заголовок Authorization: Bearer <token>)', 401));
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(new AppError('Неверный или истёкший токен', 401));
  }
}

// Для публичных эндпоинтов, которым может пригодиться личность пользователя,
// если он всё же передал токен (например, чтобы посчитать isLiked/isFavorite).
// Отсутствие или некорректность токена НЕ считается ошибкой.
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.id, role: payload.role };
    } catch {
      // невалидный токен на публичном эндпоинте просто игнорируем
    }
  }
  next();
}

// Должен идти после requireAuth
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError('Требуются права администратора', 403));
    return;
  }
  next();
}
