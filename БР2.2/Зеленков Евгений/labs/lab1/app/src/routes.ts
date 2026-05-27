import { Router } from 'express';
import { authRouter } from './routes/auth.routes';
import { menusRouter } from './routes/menus.routes';
import { reservationsRouter } from './routes/reservations.routes';
import { restaurantsRouter } from './routes/restaurants.routes';
import { reviewsRouter } from './routes/reviews.routes';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use(authRouter);
router.use(restaurantsRouter);
router.use(menusRouter);
router.use(reservationsRouter);
router.use(reviewsRouter);

//улучшить струткру проекта