import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './data-source';
import { Review } from './review.entity';

const router = Router();
const reviewRepo = () => AppDataSource.getRepository(Review);

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';

const getUserId = (req: Request): number | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
        return payload.userId;
    } catch {
        return null;
    }
};

router.get('/restaurants/:id/reviews', async (req: Request, res: Response) => {
    const restaurantId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(restaurantId)) return res.status(400).json({ message: 'Невалидный id' });

    const reviews = await reviewRepo().findBy({ restaurantId });
    return res.json(reviews);
});

router.post('/restaurants/:id/reviews', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const restaurantId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(restaurantId)) return res.status(400).json({ message: 'Невалидный id' });

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating должен быть от 1 до 5' });
    }

    // Проверяем пользователя в auth-service
    try {
        await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
    } catch {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем ресторан в restaurant-service
    try {
        await axios.get(`${RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurantId}`);
    } catch {
        return res.status(404).json({ message: 'Ресторан не найден' });
    }

    const existing = await reviewRepo().findOneBy({ userId, restaurantId });
    if (existing) return res.status(409).json({ message: 'Вы уже оставили отзыв об этом ресторане' });

    const review = reviewRepo().create({ userId, restaurantId, rating, comment: comment || null });
    await reviewRepo().save(review);

    return res.status(201).json(review);
});

export default router;