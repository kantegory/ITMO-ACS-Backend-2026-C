import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';

const router = Router();
const categoryRepo = () => AppDataSource.getRepository(Category);

/**
 * GET /categories
 * Получение списка всех категорий кухни
 */
router.get('/', async (_req: Request, res: Response) => {
  const categories = await categoryRepo().find();
  return res.json(categories);
});

export default router;
