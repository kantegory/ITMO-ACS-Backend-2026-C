import { JsonController, Get, QueryParam, UseBefore, BadRequestError } from 'routing-controllers';
import { Brackets } from 'typeorm';

import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';

import internalTokenMiddleware from '../middlewares/internal-token.middleware';

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

// Внутренняя операция 7 (docs/openapi-internal.yaml) — собственный внутренний
// эндпоинт bookings. Проверка "есть ли брони" перед удалением столика/слота/
// ресторана в restaurants (раздел 9) подключится на этапе 4 — здесь только
// сам эндпоинт, как того требует раздел 12 ("bookings + эндпоинт 7").
@JsonController()
@UseBefore(internalTokenMiddleware)
class InternalBookingController {
    // "table_ids"/"time_slot_ids" через запятую, не более 100 каждый, целые положительные.
    private parseIdList(param: string | undefined): number[] {
        if (!param) {
            return [];
        }

        const ids = param.split(',').map((part) => Number(part.trim()));
        const isValid =
            ids.length > 0 &&
            ids.length <= 100 &&
            ids.every((id) => Number.isInteger(id) && id >= 1);

        if (!isValid) {
            throw new BadRequestError('Неверные параметры запроса');
        }

        return ids;
    }

    // GET /internal/bookings/exists
    @Get('/internal/bookings/exists')
    async bookingsExist(
        @QueryParam('table_ids') tableIdsParam?: string,
        @QueryParam('time_slot_ids') timeSlotIdsParam?: string,
        @QueryParam('only_active') onlyActiveParam?: string,
    ): Promise<{ exists: boolean; count: number }> {
        if (!tableIdsParam && !timeSlotIdsParam) {
            throw new BadRequestError('Неверные параметры запроса');
        }

        const tableIds = this.parseIdList(tableIdsParam);
        const timeSlotIds = this.parseIdList(timeSlotIdsParam);
        const onlyActive = onlyActiveParam === 'true'; // умолчание false — считаются брони в любом статусе

        const qb = dataSource
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .where(
                new Brackets((sub) => {
                    if (tableIds.length > 0) {
                        sub.orWhere('booking.restaurant_table_id IN (:...tableIds)', { tableIds });
                    }
                    if (timeSlotIds.length > 0) {
                        sub.orWhere('booking.time_slot_id IN (:...timeSlotIds)', { timeSlotIds });
                    }
                }),
            );

        if (onlyActive) {
            qb.andWhere('booking.status IN (:...statuses)', { statuses: ACTIVE_STATUSES });
        }

        const count = await qb.getCount();

        return { exists: count > 0, count };
    }
}

export default InternalBookingController;
