import { IsString, IsUrl, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

import { RestaurantPhoto } from '../models/restaurant-photo.entity';

// Тело запроса POST /restaurants/{id}/photos
class RestaurantPhotoCreateDto {
    @IsString()
    @IsUrl({ require_tld: false }) // проверяет, что строка похожа на ссылку (require_tld: false — разрешает адреса вроде http://localhost)
    @Type(() => String)
    url: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_main?: boolean = false;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    sort_order?: number = 0;
}

// Форма фото в ответах API
class RestaurantPhotoDto {
    id: number;
    restaurant_id: number;
    url: string;
    is_main: boolean;
    sort_order: number;
    created_at: Date;
}

function toRestaurantPhotoDto(photo: RestaurantPhoto): RestaurantPhotoDto {
    return {
        id: photo.id,
        restaurant_id: photo.restaurant_id,
        url: photo.url,
        is_main: photo.is_main,
        sort_order: photo.sort_order,
        created_at: photo.created_at,
    };
}

export { RestaurantPhotoCreateDto, RestaurantPhotoDto, toRestaurantPhotoDto };
