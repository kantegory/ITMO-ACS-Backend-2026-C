import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';

// Внутренние эндпоинты (/internal/*) не предназначены для клиентов приложения —
// их вызывают только другие сервисы. Проверяем общий секрет из заголовка,
// известный всем сервисам (передаётся через переменную окружения INTERNAL_API_KEY).
export function requireInternalKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-internal-api-key'];
  if (key !== config.internalApiKey) {
    next(new AppError('Неверный или отсутствующий X-Internal-Api-Key', 401));
    return;
  }
  next();
}
