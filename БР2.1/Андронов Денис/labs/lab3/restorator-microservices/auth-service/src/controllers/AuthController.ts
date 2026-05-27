import { Request, Response } from "express";
import { AuthDataSource } from "../database";
import { User } from "../entities/User";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = "super_secret_key";

export class AuthController {
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

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const userRepository = AuthDataSource.getRepository(User);

            const user = await userRepository.findOneBy({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
                expiresIn: "1h",
            });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    }
}
