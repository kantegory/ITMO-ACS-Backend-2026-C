import SETTINGS from '../config/settings';
import { callInternal } from './internal-http-client';

const MAX_IDS_PER_CALL = 100; // раздел 8 CLAUDE.md

interface BookingsExistResult {
    exists: boolean;
    count: number;
}

// 400/401 от внутреннего вызова — наша же ошибка, не сбой вызываемого сервиса:
// клиенту 500, глобальный error-handler сам залогирует (раздел 7).
function assertNotOurFault(status: number): void {
    if (status === 400 || status === 401) {
        throw new Error(`bookings-service internal call failed with status ${status}`);
    }
}

function chunk(ids: number[], size: number): number[][] {
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }
    return chunks;
}

async function callBookingsExist(
    tableIds: number[],
    timeSlotIds: number[],
): Promise<BookingsExistResult> {
    const params = new URLSearchParams();
    if (tableIds.length > 0) {
        params.set('table_ids', tableIds.join(','));
    }
    if (timeSlotIds.length > 0) {
        params.set('time_slot_ids', timeSlotIds.join(','));
    }

    // only_active сознательно не передаём — умолчание false на стороне bookings
    // учитывает брони в любом статусе ("история важна при удалении", раздел 8).
    const response = await callInternal(
        `${SETTINGS.BOOKINGS_SERVICE_URL}/internal/bookings/exists?${params.toString()}`,
    );

    assertNotOurFault(response.status);

    return (await response.json()) as BookingsExistResult;
}

// Проверка перед удалением столика/слота/ресторана (раздел 9 CLAUDE.md, заменяет
// прежний ON DELETE RESTRICT на бронь). table_ids/time_slot_ids режутся на пачки
// ≤100 (ограничение раздела 8); хотя бы одна пачка с exists:true -> результат true.
async function bookingsExist(options: {
    tableIds?: number[];
    timeSlotIds?: number[];
}): Promise<BookingsExistResult> {
    const tableIds = options.tableIds ?? [];
    const timeSlotIds = options.timeSlotIds ?? [];

    if (tableIds.length === 0 && timeSlotIds.length === 0) {
        return { exists: false, count: 0 };
    }

    // Обычный случай (оба списка укладываются в один вызов, ≤100 каждый) —
    // один комбинированный запрос. Редкий случай (>100 id хотя бы в одном списке) —
    // отдельные вызовы по пачкам БЕЗ перемножения списков (иначе часть слотов/столиков
    // считалась бы несколько раз и портила бы count).
    if (tableIds.length <= MAX_IDS_PER_CALL && timeSlotIds.length <= MAX_IDS_PER_CALL) {
        return callBookingsExist(tableIds, timeSlotIds);
    }

    let exists = false;
    let count = 0;

    for (const tableChunk of chunk(tableIds, MAX_IDS_PER_CALL)) {
        const result = await callBookingsExist(tableChunk, []);
        exists = exists || result.exists;
        count += result.count;
    }

    for (const slotChunk of chunk(timeSlotIds, MAX_IDS_PER_CALL)) {
        const result = await callBookingsExist([], slotChunk);
        exists = exists || result.exists;
        count += result.count;
    }

    return { exists, count };
}

export { bookingsExist };
