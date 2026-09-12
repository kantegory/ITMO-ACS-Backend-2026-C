import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}
