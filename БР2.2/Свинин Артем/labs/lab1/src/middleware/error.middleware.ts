import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { sendApiError } from "../utils/api-error";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    sendApiError(res, error.statusCode, error.message);
    return;
  }

  sendApiError(res, 500, "Внутренняя ошибка сервера");
};
