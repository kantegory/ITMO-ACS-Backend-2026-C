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

// Копия лр1/src/controllers/menu-item.controller.ts.
class MenuItemQueryDto {
    @IsOptional()
    @IsEnum(MenuCategory)
    category?: MenuCategory;
}

@EntityController({
    baseRoute: '/restaurants/:restaurantId/menu',
    entity: MenuItem,
})
class MenuItemController extends BaseController {
    @Get('')
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

        const where: Record<string, unknown> = { restaurant_id: Number(restaurantId) };
        if (query.category) {
            where.category = query.category;
        }

        const items = await this.repository.find({ where });

        return (items as MenuItem[]).map(toMenuItemDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
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
            restaurant_id: Number(restaurantId),
        });
        await this.repository.save(item);

        return toMenuItemDto(item as MenuItem);
    }

    @Patch('/:menuItemId')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
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
