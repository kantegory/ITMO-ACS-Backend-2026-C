import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendApiError } from "../utils/api-error";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      sendApiError(res, 401, "Требуется авторизация");
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      sendApiError(res, 401, "Неверный формат токена");
      return;
    }

    const token = parts[1];
    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch {
    sendApiError(res, 401, "Недействительный или просроченный токен");
  }
};
