import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { FindOptionsWhere, In, LessThan, MoreThan } from 'typeorm';
import { adminRequired, authRequired, serviceTokenRequired } from '../../shared/auth';
import { config } from '../../shared/config';
import { listDto } from '../../shared/dto';
import { ReservationStatus, Role } from '../../shared/enums';
import { DomainEvent, OutboxEvent, RabbitMqEventPublisher } from '../../shared/events';
import { HttpError } from '../../shared/errors';
import { serviceRequest } from '../../shared/http-client';
import {
  optionalString,
  pagination,
  parseReservationStatus,
  requiredDate,
  requiredPositiveNumber,
  requiredString
} from '../../shared/validation';
import { ReservationDataSource } from './data-source';
import { Reservation } from './entities';
import { reservationDto } from './serializers';

export const reservationRouter = Router();
const publisher = new RabbitMqEventPublisher();

export async function closeReservationPublisher() {
  await publisher.close();
}

const activeStatuses = [ReservationStatus.Pending, ReservationStatus.Confirmed];

async function validateUser(userId: string, requestId?: string) {
  await serviceRequest(`${config.services.identity}/api/v1/internal/v1/users/validate`, {
    method: 'POST',
    requestId,
    body: { userId }
  });
}

async function validateRestaurantAndTable(restaurantId: string, tableId: string, guestCount: number, requestId?: string) {
  await serviceRequest(`${config.services.catalog}/api/v1/internal/v1/restaurants/${restaurantId}`, { requestId });
  await serviceRequest(`${config.services.catalog}/api/v1/internal/v1/restaurants/${restaurantId}/tables/validate`, {
    method: 'POST',
    requestId,
    body: { tableId, guestCount }
  });
}

function defaultReservedUntil(reservedAt: Date) {
  return new Date(reservedAt.getTime() + 2 * 60 * 60 * 1000);
}

function assertStatusTransition(current: ReservationStatus, next: ReservationStatus, actorRole: Role, isOwner: boolean) {
  if (current === ReservationStatus.Cancelled || current === ReservationStatus.Completed) {
    throw new HttpError(409, 'reservation_terminal_status', 'Terminal reservation cannot be changed');
  }
  if (next === ReservationStatus.Confirmed && current === ReservationStatus.Pending && actorRole === Role.Admin) return;
  if (next === ReservationStatus.Cancelled && (isOwner || actorRole === Role.Admin)) return;
  if (next === ReservationStatus.Completed && current === ReservationStatus.Confirmed && actorRole === Role.Admin) return;
  throw new HttpError(409, 'reservation_status_transition_forbidden', 'Reservation status transition is forbidden');
}

async function publishStatusChanged(reservation: Reservation, previousStatus: ReservationStatus) {
  const event: DomainEvent = {
    eventId: randomUUID(),
    eventVersion: 1,
    eventType: 'reservation.status_changed',
    occurredAt: new Date().toISOString(),
    payload: {
      reservationId: reservation.id,
      userId: reservation.userId,
      restaurantId: reservation.restaurantId,
      previousStatus,
      status: reservation.status
    }
  };

  const repo = ReservationDataSource.getRepository(OutboxEvent);
  await repo.save(repo.create({
    eventId: event.eventId,
    eventVersion: event.eventVersion,
    eventType: event.eventType,
    payload: event.payload,
    occurredAt: new Date(event.occurredAt),
    publishedAt: null
  }));
  await publisher.publish(event);
  await repo.update({ eventId: event.eventId }, { publishedAt: new Date() });
}

reservationRouter.get('/reservations', authRequired, async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const where: FindOptionsWhere<Reservation> = req.user!.role === Role.Admin ? {} : { userId: req.user!.id };
    if (req.query.status) where.status = parseReservationStatus(req.query.status);
    const [items, total] = await ReservationDataSource.getRepository(Reservation).findAndCount({
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

reservationRouter.post('/reservations', authRequired, async (req, res, next) => {
  try {
    const restaurantId = requiredString(req.body.restaurantId, 'restaurantId');
    const tableId = requiredString(req.body.tableId, 'tableId');
    const guestCount = requiredPositiveNumber(req.body.guestCount, 'guestCount');
    const reservedAt = requiredDate(req.body.reservedAt, 'reservedAt');
    const reservedUntil = req.body.reservedUntil === undefined ? defaultReservedUntil(reservedAt) : requiredDate(req.body.reservedUntil, 'reservedUntil');
    if (reservedUntil <= reservedAt) throw new HttpError(422, 'validation_error', 'reservedUntil must be after reservedAt');

    await validateUser(req.user!.id, req.requestId);
    await validateRestaurantAndTable(restaurantId, tableId, guestCount, req.requestId);

    const repo = ReservationDataSource.getRepository(Reservation);
    const conflict = await repo.findOne({
      where: {
        tableId,
        status: In(activeStatuses),
        reservedAt: LessThan(reservedUntil),
        reservedUntil: MoreThan(reservedAt)
      }
    });
    if (conflict) throw new HttpError(409, 'reservation_time_conflict', 'Table is unavailable at selected time');

    const reservation = repo.create({
      userId: req.user!.id,
      restaurantId,
      tableId,
      reservedAt,
      reservedUntil,
      guestCount,
      comment: optionalString(req.body.comment),
      status: ReservationStatus.Pending
    });
    await repo.save(reservation);
    res.status(201).json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationRouter.get('/reservations/:reservationId', authRequired, async (req, res, next) => {
  try {
    const reservation = await ReservationDataSource.getRepository(Reservation).findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    if (req.user!.role !== Role.Admin && reservation.userId !== req.user!.id) {
      throw new HttpError(403, 'forbidden', 'Forbidden');
    }
    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationRouter.patch('/reservations/:reservationId/cancel', authRequired, async (req, res, next) => {
  try {
    const repo = ReservationDataSource.getRepository(Reservation);
    const reservation = await repo.findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    const previousStatus = reservation.status;
    assertStatusTransition(reservation.status, ReservationStatus.Cancelled, req.user!.role, reservation.userId === req.user!.id);
    reservation.status = ReservationStatus.Cancelled;
    await repo.save(reservation);
    await publishStatusChanged(reservation, previousStatus);
    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationRouter.patch('/reservations/:reservationId/status', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = ReservationDataSource.getRepository(Reservation);
    const reservation = await repo.findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    const nextStatus = parseReservationStatus(req.body.status);
    const previousStatus = reservation.status;
    assertStatusTransition(reservation.status, nextStatus, req.user!.role, reservation.userId === req.user!.id);
    reservation.status = nextStatus;
    await repo.save(reservation);
    await publishStatusChanged(reservation, previousStatus);
    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationRouter.get('/internal/v1/reservations/:reservationId', serviceTokenRequired, async (req, res, next) => {
  try {
    const reservation = await ReservationDataSource.getRepository(Reservation).findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    res.json(reservationDto(reservation));
  } catch (error) {
    next(error);
  }
});

reservationRouter.post('/internal/v1/reservations/:reservationId/validate-review-eligibility', serviceTokenRequired, async (req, res, next) => {
  try {
    const reservation = await ReservationDataSource.getRepository(Reservation).findOneBy({ id: req.params.reservationId });
    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    if (reservation.userId !== requiredString(req.body.userId, 'userId')) throw new HttpError(403, 'forbidden', 'Reservation belongs to another user');
    if (reservation.status !== ReservationStatus.Completed) {
      throw new HttpError(409, 'reservation_not_completed', 'Reservation must be completed before review');
    }
    res.json({ eligible: true, reservation: reservationDto(reservation) });
  } catch (error) {
    next(error);
  }
});
