import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const router = Router();
const userRepo = () => AppDataSource.getRepository(User);

/**
 * POST /auth/register
 * Регистрация нового пользователя
 */
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

/**
 * POST /auth/login
 * Авторизация пользователя
 */
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
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' },
  );

  return res.json({ token });
});

export default router;
