import "reflect-metadata";
import {
    Get,
    Post,
    Param,
    QueryParams,
    Body,
    UseBefore,
    JsonController,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import { MenuItem } from '../models/menu-item.entity';

class ListMenuQuery {
    @IsString()
    @IsOptional()
    categoryIds?: string;
}

class CreateMenuItemDto {
    @IsString()
    categoryId: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Type(() => Number)
    price: number;
}

class MenuItemResponseDto {
    @Type(() => MenuItem)
    data: MenuItem;
}

class ListMenuResponseDto {
    @Type(() => MenuItem)
    data: MenuItem[];
}

@JsonController('/restaurants')
export class MenuController {
    private menuRepo = dataSource.getRepository(MenuItem);

    @Get('/:restaurantId/menu')
    @OpenAPI({ summary: 'Получение меню ресторана' })
    @ResponseSchema(ListMenuResponseDto, { statusCode: 200 })
    async list(
        @Param('restaurantId') restaurantId: string,
        @QueryParams({ type: ListMenuQuery }) query: ListMenuQuery,
    ): Promise<ListMenuResponseDto> {
        const where: any = { restaurantId };
        if (query.categoryIds) {
            where.categoryId = query.categoryIds;
        }

        const items = await this.menuRepo.find({ where });

        return { data: items };
    }

    @Post('/:restaurantId/menu')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создание элемента меню' })
    @ResponseSchema(MenuItemResponseDto, { statusCode: 200 })
    async create(
        @Param('restaurantId') restaurantId: string,
        @Body({ type: CreateMenuItemDto }) body: CreateMenuItemDto,
    ): Promise<MenuItemResponseDto> {
        const item = this.menuRepo.create({
            ...body,
            restaurantId,
        });

        const saved = await this.menuRepo.save(item);

        return { data: saved };
    }
}

