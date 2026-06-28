import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './data-source';
import { Booking } from './booking.entity';
import { publishBookingCreated } from './rabbitmq';

const router = Router();
const bookingRepo = () => AppDataSource.getRepository(Booking);

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

router.get('/', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const bookings = await bookingRepo().findBy({ userId });
    return res.json(bookings);
});

router.post('/', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { table_id, booking_time, guests_count } = req.body;

    if (!table_id || !booking_time || !guests_count) {
        return res.status(400).json({ message: 'table_id, booking_time и guests_count обязательны' });
    }

    try {
        await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
    } catch {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    let table: any;
    try {
        const response = await axios.get(`${RESTAURANT_SERVICE_URL}/internal/tables/${table_id}`);
        table = response.data;
    } catch {
        return res.status(404).json({ message: 'Столик не найден' });
    }

    if (guests_count > table.capacity) {
        return res.status(422).json({
            message: `guests_count (${guests_count}) превышает вместимость столика (${table.capacity})`,
        });
    }

    const bookingDate = new Date(booking_time);

    const conflict = await bookingRepo()
        .createQueryBuilder('booking')
        .where('booking.tableId = :tableId', { tableId: table_id })
        .andWhere('booking.bookingTime = :bookingTime', { bookingTime: bookingDate })
        .andWhere('booking.status != :cancelled', { cancelled: 'cancelled' })
        .getOne();

    if (conflict) {
        return res.status(409).json({ message: 'Столик уже занят на это время' });
    }

    const booking = bookingRepo().create({
        userId,
        tableId: table_id,
        bookingTime: bookingDate,
        guestsCount: guests_count,
        status: 'pending',
    });
    await bookingRepo().save(booking);

    // Публикуем событие в RabbitMQ
    await publishBookingCreated({
        bookingId: booking.id,
        userId: booking.userId,
        tableId: booking.tableId,
        bookingTime: booking.bookingTime,
        guestsCount: booking.guestsCount,
    });

    return res.status(201).json(booking);
});

router.get('/:id', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const booking = await bookingRepo().findOneBy({ id });
    if (!booking) return res.status(404).json({ message: 'Бронирование не найдено' });
    if (booking.userId !== userId) return res.status(403).json({ message: 'Это не ваше бронирование' });

    return res.json(booking);
});

router.patch('/:id/cancel', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

    const booking = await bookingRepo().findOneBy({ id });
    if (!booking) return res.status(404).json({ message: 'Бронирование не найдено' });
    if (booking.userId !== userId) return res.status(403).json({ message: 'Это не ваше бронирование' });
    if (booking.status === 'cancelled') return res.status(409).json({ message: 'Бронирование уже отменено' });

    booking.status = 'cancelled';
    await bookingRepo().save(booking);

    return res.json(booking);
});

export default router;