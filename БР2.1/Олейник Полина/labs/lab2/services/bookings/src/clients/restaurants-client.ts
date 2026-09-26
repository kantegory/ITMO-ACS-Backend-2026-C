import SETTINGS from '../config/settings';
import { callInternal } from './internal-http-client';

// Формы внутреннего API restaurants (docs/openapi-internal.yaml, операции 4-6).
// Совпадают по полям с публичными RestaurantTable/TimeSlot/RestaurantShort
// (см. решение этапа 2 — restaurants переиспользовал те же мапперы для внутреннего API).
interface TableInternal {
    id: number;
    restaurant_id: number;
    number: string;
    capacity: number;
    zone: string | null;
    is_active: boolean;
}

interface TimeSlotInternal {
    id: number;
    restaurant_id: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

interface RestaurantShort {
    id: number;
    name: string;
    address: string | null;
}

interface BookingContext {
    tables: TableInternal[];
    time_slots: TimeSlotInternal[];
    restaurants: RestaurantShort[];
}

// 400/401 от внутреннего вызова — наша же ошибка, не сбой вызываемого сервиса:
// клиенту 500, глобальный error-handler сам залогирует (раздел 7).
function assertNotOurFault(status: number): void {
    if (status === 400 || status === 401) {
        throw new Error(`restaurants-service internal call failed with status ${status}`);
    }
}

async function getBookingContext(
    tableIds: number[],
    timeSlotIds: number[],
): Promise<BookingContext> {
    if (tableIds.length === 0 && timeSlotIds.length === 0) {
        return { tables: [], time_slots: [], restaurants: [] };
    }

    const params = new URLSearchParams();
    if (tableIds.length > 0) {
        params.set('table_ids', tableIds.join(','));
    }
    if (timeSlotIds.length > 0) {
        params.set('time_slot_ids', timeSlotIds.join(','));
    }

    const response = await callInternal(
        `${SETTINGS.RESTAURANTS_SERVICE_URL}/internal/booking-context?${params.toString()}`,
    );

    assertNotOurFault(response.status);

    return (await response.json()) as BookingContext;
}

async function getRestaurantTablesInternal(
    restaurantId: number,
    options: { onlyActive?: boolean; minCapacity?: number } = {},
): Promise<TableInternal[] | null> {
    const params = new URLSearchParams();
    if (options.onlyActive !== undefined) {
        params.set('only_active', String(options.onlyActive));
    }
    if (options.minCapacity !== undefined) {
        params.set('min_capacity', String(options.minCapacity));
    }

    const response = await callInternal(
        `${SETTINGS.RESTAURANTS_SERVICE_URL}/internal/restaurants/${restaurantId}/tables?${params.toString()}`,
    );

    if (response.status === 404) {
        return null;
    }
    assertNotOurFault(response.status);

    return (await response.json()) as TableInternal[];
}

async function getManagedRestaurants(userId: number): Promise<number[]> {
    const response = await callInternal(
        `${SETTINGS.RESTAURANTS_SERVICE_URL}/internal/users/${userId}/managed-restaurants`,
    );

    assertNotOurFault(response.status);

    const body = (await response.json()) as { restaurant_ids: number[] };

    return body.restaurant_ids;
}

export { getBookingContext, getRestaurantTablesInternal, getManagedRestaurants };
export type { TableInternal, TimeSlotInternal, RestaurantShort, BookingContext };
