import {
    IsString,
    IsInt,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsIn,
    Min,
    Max,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

import { Restaurant } from '../models/restaurant.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { City } from '../models/city.entity';
import { Cuisine } from '../models/cuisine.entity';
import { PaginationQueryDto, PageMetaDto } from './pagination.dto';
import { RestaurantPhotoDto, toRestaurantPhotoDto } from './restaurant-photo.dto';
import { formatTime } from '../utils/time-format';

// Регулярное выражение для проверки времени в формате "10:00" (часы 00–23, минуты 00–59)
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
// Допустимые значения сортировки в поиске ресторанов
const SORT_VALUES = ['rating_desc', 'price_asc', 'price_desc', 'name_asc'];

// Query-параметры поиска ресторанов (GET /restaurants?...) — наследует page/limit от PaginationQueryDto
class RestaurantSearchDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    q?: string; // поиск по названию

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    city_id?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    district?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    cuisine_id?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    min_price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    max_price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    @Type(() => Number)
    min_rating?: number;

    @IsOptional()
    @IsIn(SORT_VALUES) // разрешены только значения из списка выше
    @Type(() => String)
    sort?: string = 'rating_desc';
}

// Тело запроса POST /restaurants (создание ресторана)
class RestaurantCreateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    @Type(() => String)
    name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsInt()
    @Type(() => Number)
    city_id: number;

    @IsInt()
    @Type(() => Number)
    cuisine_id: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    district?: string;

    @IsString()
    @Type(() => String)
    address: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitude?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    average_check: number;

    @IsString()
    @Matches(TIME_PATTERN) // проверяем формат "HH:MM" ещё до того, как значение попадёт в базу
    @Type(() => String)
    opening_time: string;

    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    closing_time: string;
}

// Тело запроса PATCH /restaurants/{id} — все поля необязательные
class RestaurantUpdateDto {
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
    @IsInt()
    @Type(() => Number)
    city_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    cuisine_id?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    district?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    address?: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitude?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    average_check?: number;

    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    opening_time?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    closing_time?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_active?: boolean; // используется, чтобы "скрыть" ресторан вместо удаления
}

// Короткая форма ресторана — используется внутри брони (BookingDetailsDto),
// где не нужны все поля, а важно только id/название/адрес.
class RestaurantShortDto {
    id: number;
    name: string;
    address: string | null;
}

function toRestaurantShortDto(restaurant: Restaurant): RestaurantShortDto {
    return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
    };
}

// Полная форма ресторана в ответах (список и страница ресторана)
class RestaurantResponseDto {
    id: number;
    name: string;
    description: string | null;
    city_id: number;
    cuisine_id: number;
    district: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    average_check: number;
    opening_time: string;
    closing_time: string;
    rating: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

// Страница ресторана (GET /restaurants/{id}) — то же самое плюс город, кухня и фото целиком
class RestaurantDetailsDto extends RestaurantResponseDto {
    city: City;
    cuisine: Cuisine;
    photos: RestaurantPhotoDto[];
}

// Форма ответа списка ресторанов: {items, meta}
class RestaurantPageDto {
    items: RestaurantResponseDto[];
    meta: PageMetaDto;
}

// Превращает сущность Restaurant в форму ответа — заодно обрезает время до "HH:MM"
function toRestaurantResponseDto(restaurant: Restaurant): RestaurantResponseDto {
    return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        city_id: restaurant.city_id,
        cuisine_id: restaurant.cuisine_id,
        district: restaurant.district,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        phone: restaurant.phone,
        average_check: restaurant.average_check,
        opening_time: formatTime(restaurant.opening_time),
        closing_time: formatTime(restaurant.closing_time),
        rating: restaurant.rating,
        is_active: restaurant.is_active,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at,
    };
}

// То же самое, но добавляет вложенные город/кухню/фото — для страницы одного ресторана
function toRestaurantDetailsDto(
    restaurant: Restaurant,
    photos: RestaurantPhoto[],
): RestaurantDetailsDto {
    return {
        ...toRestaurantResponseDto(restaurant),
        city: restaurant.city,
        cuisine: restaurant.cuisine,
        photos: photos.map(toRestaurantPhotoDto),
    };
}

export {
    RestaurantSearchDto,
    RestaurantCreateDto,
    RestaurantUpdateDto,
    RestaurantResponseDto,
    RestaurantDetailsDto,
    RestaurantShortDto,
    RestaurantPageDto,
    toRestaurantResponseDto,
    toRestaurantDetailsDto,
    toRestaurantShortDto,
};
