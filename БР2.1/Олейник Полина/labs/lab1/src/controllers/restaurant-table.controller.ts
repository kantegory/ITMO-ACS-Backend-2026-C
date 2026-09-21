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
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

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
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation } from '../utils/db-errors';

// Столики ресторана: список открыт всем, изменения — ADMIN или администратор ресторана.
@EntityController({
    baseRoute: '/restaurants/:restaurantId/tables',
    entity: RestaurantTable,
})
class RestaurantTableController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Столики ресторана' })
    @ResponseSchema(RestaurantTableDto, { isArray: true, statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantTableDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        // Number(restaurantId): параметр из URL всегда приходит строкой ("1"),
        // приводим к числу явно, чтобы данные в базе и в ответе были типа integer
        const tables = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
        });

        return (tables as RestaurantTable[]).map(toRestaurantTableDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Добавить столик' })
    @ResponseSchema(RestaurantTableDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        // номер столика должен быть уникальным в пределах ресторана (проверяем сами,
        // хотя в базе тоже есть @Unique — так пользователь получит понятный 409, а не ошибку SQL)
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
    @OpenAPI({ summary: 'Изменить столик' })
    @ResponseSchema(RestaurantTableDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        // проверяем дубль номера только если номер реально меняют (и меняют на другое значение) —
        // иначе столик конфликтовал бы сам с собой при сохранении без изменений
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
    @OpenAPI({ summary: 'Удалить столик' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        try {
            // если на столик есть брони — RESTRICT в базе не даст удалить,
            // превращаем эту ошибку в понятный 409 (правильный способ — отключить is_active)
            await this.repository.remove(table);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new ConflictError(
                    'Table has bookings, disable it instead (is_active = false)',
                );
            }

            throw error;
        }
    }
}

export default RestaurantTableController;
