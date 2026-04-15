import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Требуется аутентификация" });
  }
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { user: { id: string; role: string } };
    req.user = decoded.user;
    next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Некорректный токен" });
  }
}

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.header("X-Internal-Api-Key") !== config.internalApiKey) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Требуется аутентификация внутреннего вызова" });
  }
  next();
}
