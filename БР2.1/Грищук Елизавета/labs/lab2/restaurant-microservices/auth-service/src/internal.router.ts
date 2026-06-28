import { Router, Request, Response } from 'express';
import { AppDataSource } from './data-source';
import { User } from './user.entity';

const router = Router();
const userRepo = () => AppDataSource.getRepository(User);

router.get('/users/:id', async (req: Request, res: Response) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const user = await userRepo().findOneBy({ id });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    return res.json({ id: user.id, name: user.name, email: user.email });
});

export default router;