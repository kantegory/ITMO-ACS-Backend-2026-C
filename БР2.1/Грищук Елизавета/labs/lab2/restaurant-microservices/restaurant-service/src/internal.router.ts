import { Router, Request, Response } from 'express';
import { AppDataSource } from './data-source';
import { Restaurant } from './restaurant.entity';
import { Table } from './table.entity';

const router = Router();
const restaurantRepo = () => AppDataSource.getRepository(Restaurant);
const tableRepo = () => AppDataSource.getRepository(Table);

router.get('/restaurants/:id', async (req: Request, res: Response) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const restaurant = await restaurantRepo().findOneBy({ id });
    if (!restaurant) return res.status(404).json({ message: 'Ресторан не найден' });

    return res.json(restaurant);
});

router.get('/tables/:id', async (req: Request, res: Response) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const table = await tableRepo().findOneBy({ id });
    if (!table) return res.status(404).json({ message: 'Столик не найден' });

    return res.json(table);
});

export default router;