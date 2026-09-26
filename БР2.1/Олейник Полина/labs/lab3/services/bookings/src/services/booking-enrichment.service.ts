import { Booking } from '../models/booking.entity';
import {
    getBookingContext,
    RestaurantShort,
    TableInternal,
    TimeSlotInternal,
} from '../clients/restaurants-client';

interface ContextMaps {
    restaurants: Map<number, RestaurantShort>;
    tables: Map<number, TableInternal>;
    timeSlots: Map<number, TimeSlotInternal>;
}

const EMPTY_MAPS: ContextMaps = {
    restaurants: new Map(),
    tables: new Map(),
    timeSlots: new Map(),
};

// Один батч-вызов getBookingContext на все id столиков/слотов страницы вместо
// вызова на каждую бронь. `safe: true` — единственный случай из раздела 10
// (сценарий 3, GET /users/me/bookings), где сбой restaurants не должен ронять
// запрос: карты остаются пустыми, все вложенные поля станут null (см. dto/booking.dto.ts).
// Без `safe` действует общее правило раздела 7 — ошибка клиента уходит наверх как есть.
async function buildContextMaps(
    bookings: Booking[],
    options: { safe?: boolean } = {},
): Promise<ContextMaps> {
    if (bookings.length === 0) {
        return EMPTY_MAPS;
    }

    const tableIds = [...new Set(bookings.map((b) => b.restaurant_table_id))];
    const timeSlotIds = [...new Set(bookings.map((b) => b.time_slot_id))];

    const fetchMaps = async (): Promise<ContextMaps> => {
        const context = await getBookingContext(tableIds, timeSlotIds);

        return {
            restaurants: new Map(context.restaurants.map((r) => [r.id, r])),
            tables: new Map(context.tables.map((t) => [t.id, t])),
            timeSlots: new Map(context.time_slots.map((s) => [s.id, s])),
        };
    };

    if (!options.safe) {
        return fetchMaps();
    }

    try {
        return await fetchMaps();
    } catch (error) {
        console.error(
            'restaurants-service unavailable, returning bookings without restaurant/table/slot data',
            error,
        );
        return EMPTY_MAPS;
    }
}

export { buildContextMaps };
