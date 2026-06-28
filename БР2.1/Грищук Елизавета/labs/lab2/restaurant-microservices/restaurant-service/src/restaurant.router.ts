import { Router, Request, Response } from 'express';
import { AppDataSource } from './data-source';
import { Category } from './category.entity';
import { Restaurant } from './restaurant.entity';
import { Table } from './table.entity';

const router = Router();
const categoryRepo = () => AppDataSource.getRepository(Category);
const restaurantRepo = () => AppDataSource.getRepository(Restaurant);
const tableRepo = () => AppDataSource.getRepository(Table);

router.get('/categories', async (_req: Request, res: Response) => {
    const categories = await categoryRepo().find();
    return res.json(categories);
});

router.get('/restaurants', async (req: Request, res: Response) => {
    const { category_id, address, price_range } = req.query;
    const qb = restaurantRepo().createQueryBuilder('restaurant');

    if (category_id) {
        const catId = parseInt(category_id as string);
        if (isNaN(catId)) return res.status(400).json({ message: 'Невалидный category_id' });
        qb.andWhere('restaurant.categoryId = :catId', { catId });
    }
    if (address) {
        qb.andWhere('LOWER(restaurant.address) LIKE LOWER(:address)', { address: `%${address}%` });
    }
    if (price_range) {
        const pr = parseInt(price_range as string);
        if (isNaN(pr)) return res.status(400).json({ message: 'Невалидный price_range' });
        qb.andWhere('restaurant.priceRange = :pr', { pr });
    }

    const restaurants = await qb.getMany();
    return res.json(restaurants);
});

router.get('/restaurants/:id', async (req: Request, res: Response) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const restaurant = await restaurantRepo().findOneBy({ id });
    if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

    return res.json(restaurant);
});

router.get('/restaurants/:id/tables', async (req: Request, res: Response) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const restaurant = await restaurantRepo().findOneBy({ id });
    if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

    const tables = await tableRepo().findBy({ restaurantId: id });
    return res.json(tables);
});

export default router;