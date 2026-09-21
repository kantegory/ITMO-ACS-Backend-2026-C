import dataSource from '../config/data-source';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';

// Активной считается бронь, которая ещё "жива" — CANCELLED и COMPLETED не занимают столик
const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

// Ищет свободные столики ресторана на конкретную дату и слот:
// активные, нужной вместимости, и на которые НЕТ активной брони.
async function getAvailableTables(
    restaurantId: number,
    timeSlotId: number,
    date: string,
    guestsCount: number,
): Promise<RestaurantTable[]> {
    const tableRepository = dataSource.getRepository(RestaurantTable);

    // Идея запроса: LEFT JOIN столиков с бронями на эту дату/слот, а потом
    // берём только те столики, для которых JOIN не нашёл ни одной брони
    // (booking.id IS NULL). Это стандартный SQL-приём "найти отсутствие связи".
    return tableRepository
        .createQueryBuilder('table')
        .leftJoin(
            Booking,
            'booking',
            'booking.restaurant_table_id = table.id AND booking.time_slot_id = :timeSlotId AND booking.booking_date = :date AND booking.status IN (:...activeStatuses)',
        )
        .where('table.restaurant_id = :restaurantId', { restaurantId })
        .andWhere('table.is_active = true')
        .andWhere('table.capacity >= :guestsCount', { guestsCount })
        .andWhere('booking.id IS NULL') // ни одной подходящей брони не нашлось — столик свободен
        .setParameters({ timeSlotId, date, activeStatuses: ACTIVE_STATUSES })
        .orderBy('table.number', 'ASC')
        .getMany();
}

export { getAvailableTables };
