import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const userRepo = () => AppDataSource.getRepository(User);

/**
 * GET /users/me
 * Получение профиля текущего пользователя
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await userRepo().findOneBy({ id: req.userId });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  return res.json({ id: user.id, name: user.name, email: user.email });
});

/**
 * PATCH /users/me
 * Обновление профиля текущего пользователя
 */
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;

  const user = await userRepo().findOneBy({ id: req.userId });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

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
});

export default router;
