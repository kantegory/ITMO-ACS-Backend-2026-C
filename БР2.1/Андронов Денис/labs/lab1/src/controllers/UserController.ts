import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { User } from "../entities/User";

export class UserController {
    static async getUser(req: Request, res: Response) {
        const user = await AppDataSource.getRepository(User).findOneBy({ id: Number(req.params.id) });
        if (!user) return res.status(404).json({ message: "пользователь не найден" });
        res.json(user);
    }

    static async getCurrentUser(req: Request, res: Response) {
        const user = await AppDataSource.getRepository(User).findOneBy({ id: req.user!.id });
        res.json(user);
    }
}