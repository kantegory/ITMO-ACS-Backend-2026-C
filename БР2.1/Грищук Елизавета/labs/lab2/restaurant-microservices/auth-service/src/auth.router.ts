import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './data-source';
import { User } from './user.entity';

const router = Router();
const userRepo = () => AppDataSource.getRepository(User);

router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email и password обязательны' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(422).json({ message: 'Невалидный формат email' });
    }

    if (password.length < 6) {
        return res.status(422).json({ message: 'Пароль слишком слабый (минимум 6 символов)' });
    }

    const existing = await userRepo().findOneBy({ email });
    if (existing) {
        return res.status(409).json({ message: 'Email уже занят' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepo().create({ name, email, passwordHash });
    await userRepo().save(user);

    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'email и password обязательны' });
    }

    const user = await userRepo().findOneBy({ email });
    if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ message: 'Неверный пароль' });
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '24h' },
    );

    return res.json({ token });
});

router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
        const user = await userRepo().findOneBy({ id: payload.userId });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        return res.json({ id: user.id, name: user.name, email: user.email });
    } catch {
        return res.status(403).json({ message: 'Token expired or invalid' });
    }
});

router.patch('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
        const user = await userRepo().findOneBy({ id: payload.userId });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        const { name, email } = req.body;

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(422).json({ message: 'Невалидный формат email' });
            }
            const existing = await userRepo().findOneBy({ email });
            if (existing && existing.id !== user.id) {
                return res.status(409).json({ message: 'Email уже занят' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        await userRepo().save(user);

        return res.json({ id: user.id, name: user.name, email: user.email });
    } catch {
        return res.status(403).json({ message: 'Token expired or invalid' });
    }
});

export default router;