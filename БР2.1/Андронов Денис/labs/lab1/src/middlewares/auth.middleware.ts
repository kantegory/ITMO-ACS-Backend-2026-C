import { Response, NextFunction } from "express"; // убираем обычный Request
import { AuthRequest } from "../types/express"; // импортируем наш новый тип
import jwt from "jsonwebtoken";

// проверка bearer токена
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "не авторизован" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: string };
        req.user = decoded; // сохраняем данные юзера в запрос
        next();
    } catch (err) {
        return res.status(401).json({ message: "неверный токен" });
    }
};

// проверка роли админа
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ message: "доступ запрещен, требуется роль admin" });
    }
    next();
};