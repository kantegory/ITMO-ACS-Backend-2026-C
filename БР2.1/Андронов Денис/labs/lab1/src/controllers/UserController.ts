import { Response } from "express"; // убираем обычный Request
import { AuthRequest } from "../types/express"; // импортируем наш новый тип
import { AppDataSource } from "../database";
import { User } from "../entities/User";

export class UserController {
    // меняем тип req на AuthRequest
    static async getCurrentUser(req: AuthRequest, res: Response) {
        try {
            // теперь TypeScript знает, что такое req.user
            const user = await AppDataSource.getRepository(User).findOneBy({ 
                id: req.user!.id 
            });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: "ошибка сервера" });
        }
    }

    static async getUser(req: AuthRequest, res: Response) {
        const user = await AppDataSource.getRepository(User).findOneBy({ 
            id: Number(req.params.id) 
        });
        if (!user) return res.status(404).json({ message: "пользователь не найден" });
        res.json(user);
    }
}