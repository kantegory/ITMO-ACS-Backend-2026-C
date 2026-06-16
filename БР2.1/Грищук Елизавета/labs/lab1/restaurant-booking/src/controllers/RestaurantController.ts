import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Review } from '../entities/Review';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const restaurantRepo = () => AppDataSource.getRepository(Restaurant);
const tableRepo = () => AppDataSource.getRepository(Table);
const reviewRepo = () => AppDataSource.getRepository(Review);

/**
 * GET /restaurants
 * Получение списка ресторанов с фильтрацией
 */
router.get('/', async (req: Request, res: Response) => {
  const { category_id, address, price_range } = req.query;

  const qb = restaurantRepo()
    .createQueryBuilder('restaurant')
    .leftJoinAndSelect('restaurant.category', 'category');

  if (category_id) {
    const catId = parseInt(category_id as string);
    if (isNaN(catId)) return res.status(400).json({ message: 'Невалидный category_id' });
    qb.andWhere('restaurant.categoryId = :catId', { catId });
  }

  if (address) {
    qb.andWhere('LOWER(restaurant.address) LIKE LOWER(:address)', {
      address: `%${address}%`,
    });
  }

  if (price_range) {
    const pr = parseInt(price_range as string);
    if (isNaN(pr)) return res.status(400).json({ message: 'Невалидный price_range' });
    qb.andWhere('restaurant.priceRange = :pr', { pr });
  }

  const restaurants = await qb.getMany();
  return res.json(restaurants);
});

/**
 * GET /restaurants/:id
 * Детальная информация о ресторане
 */
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

  const restaurant = await restaurantRepo().findOne({
    where: { id },
    relations: ['category'],
  });

  if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

  return res.json(restaurant);
});

/**
 * GET /restaurants/:id/tables
 * Список столиков ресторана
 */
router.get('/:id/tables', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

  const restaurant = await restaurantRepo().findOneBy({ id });
  if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

  const tables = await tableRepo().findBy({ restaurantId: id });
  return res.json(tables);
});

/**
 * GET /restaurants/:id/reviews
 * Отзывы о ресторане
 */
router.get('/:id/reviews', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

  const restaurant = await restaurantRepo().findOneBy({ id });
  if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

  const reviews = await reviewRepo().find({
    where: { restaurantId: id },
    relations: ['user'],
  });

  return res.json(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      user: { id: r.user.id, name: r.user.name },
    })),
  );
});

/**
 * POST /restaurants/:id/reviews
 * Создание отзыва о ресторане
 */
router.post('/:id/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
  const restaurantId = parseInt(req.params.id);
  if (isNaN(restaurantId)) return res.status(400).json({ message: 'Невалидный id' });

  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating должен быть от 1 до 5' });
  }

  const restaurant = await restaurantRepo().findOneBy({ id: restaurantId });
  if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

  const existing = await reviewRepo().findOneBy({
    userId: req.userId,
    restaurantId,
  });
  if (existing) return res.status(409).json({ message: 'Вы уже оставили отзыв об этом ресторане' });

  const review = reviewRepo().create({
    userId: req.userId,
    restaurantId,
    rating,
    comment: comment || null,
  });
  await reviewRepo().save(review);

  return res.status(201).json(review);
});

export default router;
