import { NextFunction, Request, Response } from "express";

export const roleMiddleware =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        message: "Требуется авторизация",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "Доступ запрещен",
      });
      return;
    }

    next();
  };
