import { Router } from 'express';
import { FindOptionsWhere, In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Reservation, ReservationStatus, Restaurant, RestaurantTable, Role } from '../entities';
import { adminRequired, authRequired } from '../auth';
import { HttpError, optionalString, requiredNumber, requiredString } from '../http';
import { listDto, reservationDto } from '../serializers';
import { pagination, parseReservationStatus } from './common';

export const reservationsRouter = Router();

reservationsRouter.get('/reservations', authRequired, async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const where: FindOptionsWhere<Reservation> = req.user!.role === Role.Admin ? {} : { userId: req.user!.id };

    if (req.query.status) {
      where.status = parseReservationStatus(req.query.status);
    }

    const [items, total] = await AppDataSource.getRepository(Reservation).findAndCount({
      where,
      order: { reservedAt: 'DESC' },
      skip,
      take: limit
    });

    res.json(listDto(items.map(reservationDto), page, limit, total));
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post('/reservations', authRequired, async (req, res, next) => {
  try {
    const restaurant = await AppDataSource.getRepository(Restaurant).findOneBy({
      id: requiredString(req.body.restaurantId, 'restaurantId')
    });
    if (!restaurant) throw new HttpError(404, 'restaurant_not_found', 'Restaurant not found');

    const table = await AppDataSource.getRepository(RestaurantTable).findOneBy({
      id: requiredString(req.body.tableId, 'tableId')
    });
    if (!table) throw new HttpError(404, 'table_not_found', 'Table not found');

    // Бронь должна создаваться только на столик из выбранного ресторана.
    if (table.restaurantId !== restaurant.id) {
      throw new HttpError(409, 'table_restaurant_mismatch', 'Table does not belong to restaurant');
    }

    const reservedAt = new Date(requiredString(req.body.reservedAt, 'reservedAt'));
    const busy = await AppDataSource.getRepository(Reservation).findOneBy({
      tableId: table.id,
      reservedAt,
      status: In([ReservationStatus.Pending, ReservationStatus.Confirmed])
    });

    if (busy) throw new HttpError(409, 'table_unavailable', 'Table is unavailable at selected time');

    const repo = AppDataSource.getRepository(Reservation);
    const reservation = repo.create({
      userId: req.user!.id,
      restaurantId: restaurant.id,
      tableId: table.id,
      reservedAt,
      guestCount: requiredNumber(req.body.guestCount, 'guestCount'),
      comment: optionalString(req.body.comment),
      status: ReservationStatus.Pending
    });

    await repo.save(reservation);
    res.status(201).json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationsRouter.get('/reservations/:reservationId', authRequired, async (req, res, next) => {
  try {
    const reservation = await AppDataSource.getRepository(Reservation).findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    if (req.user!.role !== Role.Admin && reservation.userId !== req.user!.id) {
      throw new HttpError(403, 'forbidden', 'Forbidden');
    }

    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationsRouter.patch('/reservations/:reservationId/cancel', authRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    const reservation = await repo.findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    if (req.user!.role !== Role.Admin && reservation.userId !== req.user!.id) {
      throw new HttpError(403, 'forbidden', 'Forbidden');
    }

    reservation.status = ReservationStatus.Cancelled;
    await repo.save(reservation);

    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationsRouter.patch('/reservations/:reservationId/status', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    const reservation = await repo.findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');

    reservation.status = parseReservationStatus(req.body.status);
    await repo.save(reservation);

    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});
