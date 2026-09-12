import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Единый формат ответа об ошибке для всего API: { "message": "..." }
// Должен быть подключён самым последним middleware в приложении.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error('Непредвиденная ошибка на сервере:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}
