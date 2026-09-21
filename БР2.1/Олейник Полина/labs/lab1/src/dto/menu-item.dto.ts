import {
    IsString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsUrl,
    Min,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { MenuItem } from '../models/menu-item.entity';
import { MenuCategory } from '../models/enums/menu-category.enum';

// Тело запроса POST /restaurants/{id}/menu
class MenuItemCreateDto {
    @IsEnum(MenuCategory) // значение должно быть одним из APPETIZER/MAIN_COURSE/DESSERT/DRINK
    category: MenuCategory;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    @Type(() => String)
    name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsOptional()
    @IsString()
    @IsUrl({ require_tld: false })
    @Type(() => String)
    photo_url?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_available?: boolean = true;
}

// Тело запроса PATCH /restaurants/{id}/menu/{menuItemId} — всё необязательно
class MenuItemUpdateDto {
    @IsOptional()
    @IsEnum(MenuCategory)
    category?: MenuCategory;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsString()
    @IsUrl({ require_tld: false })
    @Type(() => String)
    photo_url?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_available?: boolean;
}

// Форма позиции меню в ответах API
class MenuItemDto {
    id: number;
    restaurant_id: number;
    category: MenuCategory;
    name: string;
    description: string | null;
    price: number;
    photo_url: string | null;
    is_available: boolean;
}

function toMenuItemDto(item: MenuItem): MenuItemDto {
    return {
        id: item.id,
        restaurant_id: item.restaurant_id,
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        photo_url: item.photo_url,
        is_available: item.is_available,
    };
}

export { MenuItemCreateDto, MenuItemUpdateDto, MenuItemDto, toMenuItemDto };
