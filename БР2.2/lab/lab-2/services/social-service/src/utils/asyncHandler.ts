import { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 не умеет сам ловить ошибки из async-функций.
// Эта обёртка перехватывает reject/throw и передаёт ошибку в next(),
// чтобы её обработал общий errorHandler.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
