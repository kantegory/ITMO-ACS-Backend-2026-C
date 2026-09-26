import {
    IsString,
    IsInt,
    IsOptional,
    IsBoolean,
    Min,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { RestaurantTable } from '../models/restaurant-table.entity';

// Копия лр1/src/dto/restaurant-table.dto.ts.
class RestaurantTableCreateDto {
    @IsString()
    @MinLength(1)
    @Type(() => String)
    number: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    capacity: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    zone?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_active?: boolean = true;
}

class RestaurantTableUpdateDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @Type(() => String)
    number?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    capacity?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    zone?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_active?: boolean;
}

class RestaurantTableDto {
    id: number;
    restaurant_id: number;
    number: string;
    capacity: number;
    zone: string | null;
    is_active: boolean;
}

function toRestaurantTableDto(table: RestaurantTable): RestaurantTableDto {
    return {
        id: table.id,
        restaurant_id: table.restaurant_id,
        number: table.number,
        capacity: table.capacity,
        zone: table.zone,
        is_active: table.is_active,
    };
}

export {
    RestaurantTableCreateDto,
    RestaurantTableUpdateDto,
    RestaurantTableDto,
    toRestaurantTableDto,
};
