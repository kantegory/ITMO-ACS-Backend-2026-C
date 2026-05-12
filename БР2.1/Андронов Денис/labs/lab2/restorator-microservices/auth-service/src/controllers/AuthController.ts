import { Request, Response } from "express";
import { AuthDataSource } from "../database";
import { User } from "../entities/User";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { ValidateTokenResponse } from "../../../shared/types"; // импорт из общей папки

const JWT_SECRET = "super_secret_key"; // env

export class AuthController {
    // Регистрация (Публичный)
    static async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const userRepository = AuthDataSource.getRepository(User);

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = userRepository.create({ email, password: hashedPassword });
            await userRepository.save(user);

            res.status(201).json({ message: "User created", userId: user.id });
        } catch (error) {
            res.status(400).json({ error: "Registration failed" });
        }
    }

    // Логин (Публичный)
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const userRepository = AuthDataSource.getRepository(User);

            const user = await userRepository.findOneBy({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Внутренний эндпоинт (Только для других микросервисов)
    // Проверяет токен и возвращает ID пользователя
    static async validateToken(req: Request, res: Response) {
        const { token } = req.body;
        if (!token) return res.status(401).json({ isValid: false });

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
            const response: ValidateTokenResponse = {
                isValid: true,
                userId: decoded.id,
                role: decoded.role
            };
            res.json(response);
        } catch (error) {
            res.status(401).json({ isValid: false });
        }
    }
}