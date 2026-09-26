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

// Копия лр1/src/dto/restaurant.dto.ts.
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const SORT_VALUES = ['rating_desc', 'price_asc', 'price_desc', 'name_asc'];

class RestaurantSearchDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    q?: string;

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
    @IsIn(SORT_VALUES)
    @Type(() => String)
    sort?: string = 'rating_desc';
}

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
    @Matches(TIME_PATTERN)
    @Type(() => String)
    opening_time: string;

    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    closing_time: string;
}

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
    is_active?: boolean;
}

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

class RestaurantDetailsDto extends RestaurantResponseDto {
    city: City;
    cuisine: Cuisine;
    photos: RestaurantPhotoDto[];
}

class RestaurantPageDto {
    items: RestaurantResponseDto[];
    meta: PageMetaDto;
}

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
