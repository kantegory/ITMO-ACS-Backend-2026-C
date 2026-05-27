import { Reservation } from './entities';

export function reservationDto(reservation: Reservation) {
  return {
    id: reservation.id,
    userId: reservation.userId,
    restaurantId: reservation.restaurantId,
    tableId: reservation.tableId,
    reservedAt: reservation.reservedAt,
    reservedUntil: reservation.reservedUntil,
    status: reservation.status,
    comment: reservation.comment,
    guestCount: reservation.guestCount,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt
  };
}
