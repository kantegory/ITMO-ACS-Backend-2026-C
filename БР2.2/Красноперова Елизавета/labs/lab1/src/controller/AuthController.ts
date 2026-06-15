import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your-secret-key-change-in-production";
const userRepository = () => AppDataSource.getRepository(User);

export class AuthController {
    static register = async (req: Request, res: Response) => {
        try {
            const { username, email, password } = req.body;

            
            const existing = await userRepository().findOne({ where: [{ username }, { email }] });
            if (existing) {
                return res.status(409).json({ error: { code: "CONFLICT", message: "Username или email уже занят" } });
            }

            const password_hash = await bcrypt.hash(password, 10);
            const user = userRepository().create({ username, email, password_hash });
            await userRepository().save(user);

            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });
            return res.status(201).json({
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    avatar_url: user.avatar_url,
                    bio: user.bio
                }
            });
        } catch (error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
        }
    };

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user = await userRepository().findOne({ where: { email } });

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Неверный email или пароль" } });
            }

            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });
            return res.json({
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    avatar_url: user.avatar_url,
                    bio: user.bio
                }
            });
        } catch (error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
        }
    };
}