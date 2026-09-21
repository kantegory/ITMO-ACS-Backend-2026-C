import { NotFoundError, BadRequestError } from 'routing-controllers';

import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { TimeSlot } from '../models/time-slot.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';
import { ConflictError } from '../errors/http-errors';
import { isUniqueViolation } from '../utils/db-errors';

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

// Что нужно, чтобы создать бронь — то же самое, что в BookingCreateDto,
// но описано отдельно, чтобы сервис не зависел от слоя DTO/HTTP
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

// Вся бизнес-логика создания брони: проверки + запись в базу.
// Вынесена из контроллера, чтобы booking.controller.ts оставался коротким
// и отвечал только за HTTP-часть (права доступа, разбор запроса).
async function createBooking(
    userId: number,
    data: CreateBookingInput,
): Promise<Booking> {
    const tableRepository = dataSource.getRepository(RestaurantTable);
    const slotRepository = dataSource.getRepository(TimeSlot);
    const bookingRepository = dataSource.getRepository(Booking);

    const table = await tableRepository.findOneBy({
        id: data.restaurant_table_id,
    });
    if (!table || !table.is_active) {
        throw new NotFoundError('Table not found');
    }

    const slot = await slotRepository.findOneBy({ id: data.time_slot_id });
    if (!slot || !slot.is_active) {
        throw new NotFoundError('Time slot not found');
    }

    // столик и слот должны принадлежать одному и тому же ресторану —
    // иначе можно было бы забронировать столик одного ресторана на слот другого
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

    // проверяем в коде, что на этот столик/слот/дату нет уже активной брони
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
            restaurant_table_id: data.restaurant_table_id,
            time_slot_id: data.time_slot_id,
            booking_date: data.booking_date,
            guests_count: data.guests_count,
            comment: data.comment,
        });
        await bookingRepository.save(booking);

        return booking;
    } catch (error) {
        // если два одновременных запроса прошли проверку выше одновременно (до того,
        // как первый успел сохраниться) — частичный уникальный индекс в базе (см.
        // booking.entity.ts) всё равно не даст создать вторую бронь, и мы поймаем это здесь
        if (isUniqueViolation(error)) {
            throw new ConflictError(
                'Table is already booked for this date and time slot',
            );
        }

        throw error;
    }
}

// Карта допустимых переходов между статусами брони
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    [BookingStatus.CANCELLED]: [], // конечный статус — переходов из него нет
    [BookingStatus.COMPLETED]: [], // тоже конечный
};

function canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}

export { createBooking, canTransition };
