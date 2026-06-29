import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { UserRole } from "../entities/User";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  const token = header.substring(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Невалидный или истёкший токен" });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Требуется авторизация" });
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Недостаточно прав" });
      return;
    }
    next();
  };
}
