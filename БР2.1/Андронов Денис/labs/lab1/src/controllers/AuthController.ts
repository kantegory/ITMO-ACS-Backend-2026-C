import { Request, Response } from "express";
import { AppDataSource } from "../routes/index";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthController {
    static async register(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(User);
        const { first_name, last_name, middle_name, email, password } = req.body;

        const exists = await repo.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: "пользователь с таким email уже существует" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = repo.create({ first_name, last_name, middle_name, email, password: hashedPassword });
        
        await repo.save(user);
        res.status(201).json(user); // отдаем без пароля
    }

    static async login(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(User);
        const { email, password } = req.body;

        // запрашиваем пароль явно, так как в модели стоит select: false
        const user = await repo.findOne({ where: { email }, select: ["id", "password", "role", "email", "first_name", "last_name"] });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "неверный email или пароль" });
        }

        const access_token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "24h" });
        
        // удаляем пароль из ответа
        const { password: _, ...userWithoutPassword } = user;
        res.json({ access_token, user: userWithoutPassword });
    }
}