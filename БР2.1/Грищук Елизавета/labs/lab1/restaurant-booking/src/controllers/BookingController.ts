import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Booking } from '../entities/Booking';
import { Table } from '../entities/Table';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const bookingRepo = () => AppDataSource.getRepository(Booking);
const tableRepo = () => AppDataSource.getRepository(Table);

/**
 * GET /bookings
 * История бронирований пользователя
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const bookings = await bookingRepo().find({
    where: { userId: req.userId },
    relations: ['table', 'table.restaurant'],
  });
  return res.json(bookings);
});

/**
 * POST /bookings
 * Создание нового бронирования
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { table_id, booking_time, guests_count } = req.body;

  if (!table_id || !booking_time || !guests_count) {
    return res.status(400).json({ message: 'table_id, booking_time и guests_count обязательны' });
  }

  const table = await tableRepo().findOneBy({ id: parseInt(table_id) });
  if (!table) return res.status(404).json({ message: 'Столик не найден' });

  if (guests_count > table.capacity) {
    return res.status(422).json({
      message: `guests_count (${guests_count}) превышает вместимость столика (${table.capacity})`,
    });
  }

  const bookingDate = new Date(booking_time);

  // Проверка, что столик не занят в это время
  const conflict = await bookingRepo()
    .createQueryBuilder('booking')
    .where('booking.tableId = :tableId', { tableId: table.id })
    .andWhere('booking.bookingTime = :bookingTime', { bookingTime: bookingDate })
    .andWhere('booking.status != :cancelled', { cancelled: 'cancelled' })
    .getOne();

  if (conflict) {
    return res.status(409).json({ message: 'Столик уже занят на это время' });
  }

  const booking = bookingRepo().create({
    userId: req.userId,
    tableId: table.id,
    bookingTime: bookingDate,
    guestsCount: guests_count,
    status: 'pending',
  });
  await bookingRepo().save(booking);

  return res.status(201).json(booking);
});

/**
 * GET /bookings/:id
 * Информация о конкретном бронировании
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

  const booking = await bookingRepo().findOne({
    where: { id },
    relations: ['table', 'table.restaurant'],
  });

  if (!booking) return res.status(404).json({ message: 'Бронирование не найдено' });
  if (booking.userId !== req.userId) {
    return res.status(403).json({ message: 'Это не ваше бронирование' });
  }

  return res.json(booking);
});

/**
 * PATCH /bookings/:id/cancel
 * Отмена бронирования
 */
router.patch('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Невалидный id' });

  const booking = await bookingRepo().findOneBy({ id });
  if (!booking) return res.status(404).json({ message: 'Бронирование не найдено' });
  if (booking.userId !== req.userId) {
    return res.status(403).json({ message: 'Это не ваше бронирование' });
  }
  if (booking.status === 'cancelled') {
    return res.status(409).json({ message: 'Бронирование уже отменено' });
  }

  booking.status = 'cancelled';
  await bookingRepo().save(booking);

  return res.json(booking);
});

export default router;
