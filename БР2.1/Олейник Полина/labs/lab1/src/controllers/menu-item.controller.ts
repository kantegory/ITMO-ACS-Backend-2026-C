import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    QueryParams,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsEnum, IsOptional } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { MenuItem } from '../models/menu-item.entity';
import { Restaurant } from '../models/restaurant.entity';
import { MenuCategory } from '../models/enums/menu-category.enum';

import authMiddleware from '../middlewares/auth.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    MenuItemCreateDto,
    MenuItemUpdateDto,
    MenuItemDto,
    toMenuItemDto,
} from '../dto/menu-item.dto';
import { ErrorDto } from '../dto/error.dto';

// Query-параметр для фильтра меню по категории: GET .../menu?category=DESSERT
class MenuItemQueryDto {
    @IsOptional()
    @IsEnum(MenuCategory)
    category?: MenuCategory;
}

// Меню ресторана: список открыт всем, изменения — ADMIN или администратор этого ресторана.
@EntityController({
    baseRoute: '/restaurants/:restaurantId/menu',
    entity: MenuItem,
})
class MenuItemController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Меню ресторана' })
    @ResponseSchema(MenuItemDto, { isArray: true, statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantId: number,
        @QueryParams({ type: MenuItemQueryDto }) query: MenuItemQueryDto,
    ): Promise<MenuItemDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        // Number(restaurantId): параметр пути из URL всегда приходит строкой ("1"),
        // а без явного приведения типа он бы так строкой и остался в объекте where —
        // TypeORM сравнил бы правильно, но лучше не полагаться на неявное приведение
        const where: Record<string, unknown> = { restaurant_id: Number(restaurantId) };
        if (query.category) {
            where.category = query.category; // фильтр по категории добавляем только если он передан
        }

        const items = await this.repository.find({ where });

        return (items as MenuItem[]).map(toMenuItemDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Добавить позицию меню' })
    @ResponseSchema(MenuItemDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async create(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: MenuItemCreateDto }) data: MenuItemCreateDto,
    ): Promise<MenuItemDto> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const item = this.repository.create({
            ...data,
            restaurant_id: Number(restaurantId), // без Number() сюда попала бы строка, и в ответе API
            // restaurant_id пришёл бы как "1" вместо 1 — нарушая контракт спецификации (integer)
        });
        await this.repository.save(item);

        return toMenuItemDto(item as MenuItem);
    }

    @Patch('/:menuItemId')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Изменить позицию меню' })
    @ResponseSchema(MenuItemDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async update(
        @Param('restaurantId') restaurantId: number,
        @Param('menuItemId') menuItemId: number,
        @Body({ type: MenuItemUpdateDto }) data: MenuItemUpdateDto,
    ): Promise<MenuItemDto> {
        const item = await this.repository.findOneBy({
            id: menuItemId,
            restaurant_id: Number(restaurantId),
        });

        if (!item) {
            throw new NotFoundError('Menu item not found');
        }

        Object.assign(item as MenuItem, data);
        await this.repository.save(item as MenuItem);

        return toMenuItemDto(item as MenuItem);
    }

    @Delete('/:menuItemId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Удалить позицию меню' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async remove(
        @Param('restaurantId') restaurantId: number,
        @Param('menuItemId') menuItemId: number,
    ): Promise<void> {
        const item = await this.repository.findOneBy({
            id: menuItemId,
            restaurant_id: Number(restaurantId),
        });

        if (!item) {
            throw new NotFoundError('Menu item not found');
        }

        await this.repository.remove(item);
    }
}

export default MenuItemController;
