import { ApiError } from "./validation";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1] || "";
    res.locals.user = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    next();
  } catch {
    res.status(401).json({ message: "Нужен действующий токен" });
  }
}

export function errors(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message });
  if (err.code === "23505") return res.status(409).json({ message: "Такая запись уже существует" });
  if (["22P02", "22007", "22008", "23502", "23503", "22001", "23514"].includes(err.code) || err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Некорректные данные запроса" });
  }
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
}
