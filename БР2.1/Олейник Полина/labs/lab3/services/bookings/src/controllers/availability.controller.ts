import { JsonController, Get, Param, QueryParams, NotFoundError, BadRequestError } from 'routing-controllers';

import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';

import { AvailabilityQueryDto, AvailabilityDto } from '../dto/availability.dto';
import { getBookingContext, getRestaurantTablesInternal } from '../clients/restaurants-client';

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// Адаптация лр1/src/controllers/availability.controller.ts + services/availability.service.ts:
// GET /restaurants/{id}/availability закреплён за bookings, не restaurants (раздел 6 CLAUDE.md,
// таблица gateway). Слот — через эндпоинт 4, столики — через эндпоинт 5, анти-джойн — по
// собственной таблице Booking (раздел 10, сценарий 2).
@JsonController('/restaurants/:restaurantId/availability')
class AvailabilityController {
    @Get('')
    async get(
        @Param('restaurantId') restaurantIdParam: number,
        @QueryParams({ type: AvailabilityQueryDto }) query: AvailabilityQueryDto,
    ): Promise<AvailabilityDto> {
        const restaurantId = Number(restaurantIdParam);

        const context = await getBookingContext([], [query.time_slot_id]);
        const timeSlot = context.time_slots.find(
            (slot) =>
                slot.id === query.time_slot_id &&
                slot.restaurant_id === restaurantId &&
                slot.is_active,
        );
        if (!timeSlot) {
            throw new NotFoundError('Time slot not found for this restaurant');
        }

        if (query.date < today()) {
            throw new BadRequestError('date must not be in the past');
        }

        const tables = await getRestaurantTablesInternal(restaurantId, {
            onlyActive: true,
            minCapacity: query.guests_count,
        });
        if (tables === null) {
            throw new NotFoundError('Restaurant not found');
        }

        const freeTables =
            tables.length === 0 ? [] : await this.excludeBookedTables(tables, query);

        return {
            date: query.date,
            time_slot: timeSlot,
            tables: freeTables.sort((a, b) => (a.number < b.number ? -1 : 1)),
        };
    }

    private async excludeBookedTables<T extends { id: number }>(
        tables: T[],
        query: AvailabilityQueryDto,
    ): Promise<T[]> {
        const tableIds = tables.map((table) => table.id);

        const bookedRows = await dataSource
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .select('DISTINCT booking.restaurant_table_id', 'restaurant_table_id')
            .where('booking.restaurant_table_id IN (:...tableIds)', { tableIds })
            .andWhere('booking.time_slot_id = :timeSlotId', { timeSlotId: query.time_slot_id })
            .andWhere('booking.booking_date = :date', { date: query.date })
            .andWhere('booking.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
            .getRawMany();

        const bookedTableIds = new Set(bookedRows.map((row) => Number(row.restaurant_table_id)));

        return tables.filter((table) => !bookedTableIds.has(table.id));
    }
}

export default AvailabilityController;
