import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { RestaurantTable } from '../models/restaurant-table.entity';
import { Restaurant } from '../models/restaurant.entity';

import authMiddleware from '../middlewares/auth.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    RestaurantTableCreateDto,
    RestaurantTableUpdateDto,
    RestaurantTableDto,
    toRestaurantTableDto,
} from '../dto/restaurant-table.dto';
import { ConflictError } from '../errors/http-errors';
import { bookingsExist } from '../clients/bookings-client';

// Адаптация лр1/src/controllers/restaurant-table.controller.ts: ON DELETE RESTRICT
// на бронь заменён вызовом эндпоинта 7 перед удалением (раздел 9 CLAUDE.md) —
// локального FK на booking внутри restaurants_db больше нет (бронь в другой БД).
@EntityController({
    baseRoute: '/restaurants/:restaurantId/tables',
    entity: RestaurantTable,
})
class RestaurantTableController extends BaseController {
    @Get('')
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantTableDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const tables = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
        });

        return (tables as RestaurantTable[]).map(toRestaurantTableDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async create(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: RestaurantTableCreateDto }) data: RestaurantTableCreateDto,
    ): Promise<RestaurantTableDto> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const existing = await this.repository.findOneBy({
            restaurant_id: Number(restaurantId),
            number: data.number,
        });
        if (existing) {
            throw new ConflictError(
                'Table with this number already exists in the restaurant',
            );
        }

        const table = this.repository.create({
            ...data,
            restaurant_id: Number(restaurantId),
        });
        await this.repository.save(table);

        return toRestaurantTableDto(table as RestaurantTable);
    }

    @Patch('/:tableId')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async update(
        @Param('restaurantId') restaurantId: number,
        @Param('tableId') tableId: number,
        @Body({ type: RestaurantTableUpdateDto }) data: RestaurantTableUpdateDto,
    ): Promise<RestaurantTableDto> {
        const table = await this.repository.findOneBy({
            id: tableId,
            restaurant_id: Number(restaurantId),
        });

        if (!table) {
            throw new NotFoundError('Table not found');
        }

        if (data.number !== undefined && data.number !== (table as RestaurantTable).number) {
            const existing = await this.repository.findOneBy({
                restaurant_id: Number(restaurantId),
                number: data.number,
            });
            if (existing) {
                throw new ConflictError(
                    'Table with this number already exists in the restaurant',
                );
            }
        }

        Object.assign(table as RestaurantTable, data);
        await this.repository.save(table as RestaurantTable);

        return toRestaurantTableDto(table as RestaurantTable);
    }

    @Delete('/:tableId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async remove(
        @Param('restaurantId') restaurantId: number,
        @Param('tableId') tableId: number,
    ): Promise<void> {
        const table = await this.repository.findOneBy({
            id: tableId,
            restaurant_id: Number(restaurantId),
        });

        if (!table) {
            throw new NotFoundError('Table not found');
        }

        const { exists } = await bookingsExist({ tableIds: [Number(tableId)] });
        if (exists) {
            throw new ConflictError(
                'Table has bookings, disable it instead (is_active = false)',
            );
        }

        await this.repository.remove(table);
    }
}

export default RestaurantTableController;
