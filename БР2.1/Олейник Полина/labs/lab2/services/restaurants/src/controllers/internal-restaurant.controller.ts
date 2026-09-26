import {
    JsonController,
    Get,
    Param,
    QueryParam,
    UseBefore,
    BadRequestError,
    NotFoundError,
} from 'routing-controllers';
import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { TimeSlot } from '../models/time-slot.entity';
import { RestaurantAdmin } from '../models/restaurant-admin.entity';

import internalTokenMiddleware from '../middlewares/internal-token.middleware';

import { toRestaurantTableDto, RestaurantTableDto } from '../dto/restaurant-table.dto';
import { toTimeSlotDto, TimeSlotDto } from '../dto/time-slot.dto';
import { toRestaurantShortDto, RestaurantShortDto } from '../dto/restaurant.dto';

// Внутренний API restaurants (операции 4-6, docs/openapi-internal.yaml). Пути без
// /api/v1 — регистрируются отдельным вызовом useExpressServer в app.ts, как в auth.
// TableInternal/TimeSlotInternal/RestaurantShort из спецификации совпадают по форме
// с уже существующими RestaurantTableDto/TimeSlotDto/RestaurantShortDto — переиспользуем их.
@JsonController()
@UseBefore(internalTokenMiddleware)
class InternalRestaurantController {
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

    // GET /internal/booking-context
    @Get('/internal/booking-context')
    async getBookingContext(
        @QueryParam('table_ids') tableIdsParam?: string,
        @QueryParam('time_slot_ids') timeSlotIdsParam?: string,
    ): Promise<{
        tables: RestaurantTableDto[];
        time_slots: TimeSlotDto[];
        restaurants: RestaurantShortDto[];
    }> {
        if (!tableIdsParam && !timeSlotIdsParam) {
            throw new BadRequestError('Неверные параметры запроса');
        }

        const tableIds = this.parseIdList(tableIdsParam);
        const timeSlotIds = this.parseIdList(timeSlotIdsParam);

        const tables = tableIds.length
            ? await dataSource.getRepository(RestaurantTable).findBy({ id: In(tableIds) })
            : [];
        const timeSlots = timeSlotIds.length
            ? await dataSource.getRepository(TimeSlot).findBy({ id: In(timeSlotIds) })
            : [];

        const restaurantIds = [
            ...new Set([
                ...tables.map((table) => table.restaurant_id),
                ...timeSlots.map((slot) => slot.restaurant_id),
            ]),
        ];
        const restaurants = restaurantIds.length
            ? await dataSource.getRepository(Restaurant).findBy({ id: In(restaurantIds) })
            : [];

        return {
            tables: tables.map(toRestaurantTableDto),
            time_slots: timeSlots.map(toTimeSlotDto),
            restaurants: restaurants.map(toRestaurantShortDto),
        };
    }

    // GET /internal/restaurants/{restaurantId}/tables
    @Get('/internal/restaurants/:restaurantId/tables')
    async getRestaurantTablesInternal(
        @Param('restaurantId') restaurantId: number,
        @QueryParam('only_active') onlyActiveParam?: string,
        @QueryParam('min_capacity') minCapacityParam?: string,
    ): Promise<RestaurantTableDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const onlyActive = onlyActiveParam !== 'false'; // default true
        const minCapacity = minCapacityParam !== undefined ? Number(minCapacityParam) : undefined;

        const qb = dataSource
            .getRepository(RestaurantTable)
            .createQueryBuilder('table')
            .where('table.restaurant_id = :restaurantId', { restaurantId });

        if (onlyActive) {
            qb.andWhere('table.is_active = true');
        }
        if (minCapacity !== undefined) {
            qb.andWhere('table.capacity >= :minCapacity', { minCapacity });
        }

        const tables = await qb.getMany();

        return tables.map(toRestaurantTableDto);
    }

    // GET /internal/users/{userId}/managed-restaurants
    @Get('/internal/users/:userId/managed-restaurants')
    async getManagedRestaurants(
        @Param('userId') userId: number,
    ): Promise<{ user_id: number; restaurant_ids: number[] }> {
        const records = await dataSource
            .getRepository(RestaurantAdmin)
            .findBy({ user_id: userId });

        // @Param не гарантированно приводит значение к number (не для всех версий
        // routing-controllers) — приводим явно, чтобы в ответе был integer, как того
        // требует схема ManagedRestaurants (docs/openapi-internal.yaml), а не строка.
        return {
            user_id: Number(userId),
            restaurant_ids: records.map((record) => record.restaurant_id),
        };
    }
}

export default InternalRestaurantController;
