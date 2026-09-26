import { NotFoundError, BadRequestError } from 'routing-controllers';

import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';
import { ConflictError } from '../errors/http-errors';
import { isUniqueViolation } from '../utils/db-errors';
import { getBookingContext } from '../clients/restaurants-client';
import { publishBookingCreated } from '../messaging/booking-events.publisher';

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

interface CreateBookingInput {
    restaurant_table_id: number;
    time_slot_id: number;
    booking_date: string;
    guests_count: number;
    comment?: string;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// Адаптация лр1/src/services/booking.service.ts: столик и слот больше не читаются
// из локальных репозиториев (их здесь нет) — один вызов getBookingContext заменяет
// оба lookup'а (эндпоинт 4, раздел 10 CLAUDE.md, сценарий 1). Остальная
// последовательность проверок и локальная проверка занятости — без изменений.
async function createBooking(
    userId: number,
    data: CreateBookingInput,
): Promise<Booking> {
    const bookingRepository = dataSource.getRepository(Booking);

    const context = await getBookingContext(
        [data.restaurant_table_id],
        [data.time_slot_id],
    );

    const table = context.tables.find((t) => t.id === data.restaurant_table_id);
    if (!table || !table.is_active) {
        throw new NotFoundError('Table not found');
    }

    const slot = context.time_slots.find((s) => s.id === data.time_slot_id);
    if (!slot || !slot.is_active) {
        throw new NotFoundError('Time slot not found');
    }

    if (table.restaurant_id !== slot.restaurant_id) {
        throw new BadRequestError(
            'Table and time slot must belong to the same restaurant',
        );
    }

    if (data.guests_count > table.capacity) {
        throw new BadRequestError('guests_count exceeds table capacity');
    }

    if (data.booking_date < today()) {
        throw new BadRequestError('booking_date must not be in the past');
    }

    const existing = await bookingRepository
        .createQueryBuilder('booking')
        .where('booking.restaurant_table_id = :tableId', {
            tableId: data.restaurant_table_id,
        })
        .andWhere('booking.time_slot_id = :slotId', {
            slotId: data.time_slot_id,
        })
        .andWhere('booking.booking_date = :date', {
            date: data.booking_date,
        })
        .andWhere('booking.status IN (:...statuses)', {
            statuses: ACTIVE_STATUSES,
        })
        .getOne();

    if (existing) {
        throw new ConflictError(
            'Table is already booked for this date and time slot',
        );
    }

    try {
        const booking = bookingRepository.create({
            user_id: userId,
            restaurant_id: table.restaurant_id,
            restaurant_table_id: data.restaurant_table_id,
            time_slot_id: data.time_slot_id,
            booking_date: data.booking_date,
            guests_count: data.guests_count,
            comment: data.comment,
        });
        await bookingRepository.save(booking);
        publishBookingCreated(booking);

        return booking;
    } catch (error) {
        if (isUniqueViolation(error)) {
            throw new ConflictError(
                'Table is already booked for this date and time slot',
            );
        }

        throw error;
    }
}

// Копия лр1/src/services/booking.service.ts — без изменений.
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    [BookingStatus.CANCELLED]: [],
    [BookingStatus.COMPLETED]: [],
};

function canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}

export { createBooking, canTransition };
