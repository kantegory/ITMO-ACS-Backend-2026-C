import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    IsBoolean,
    Min,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '../models/property.entity';

export class CreatePropertyDto {
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    @Type(() => String)
    title: string;

    @IsString()
    @MaxLength(5000)
    @Type(() => String)
    description: string;

    @IsEnum(PropertyType)
    type: PropertyType;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    pricePerDay: number;

    @IsString()
    @MinLength(5)
    @MaxLength(500)
    @Type(() => String)
    address: string;

    @IsNumber()
    @Type(() => Number)
    cityId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    roomsCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    area?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    maxGuests?: number;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    comfortIds?: number[];
}

export class UpdatePropertyDto {
    @IsOptional()
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    @Type(() => String)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsEnum(PropertyType)
    type?: PropertyType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    pricePerDay?: number;

    @IsOptional()
    @IsString()
    @MinLength(5)
    @MaxLength(500)
    @Type(() => String)
    address?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    cityId?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    roomsCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    area?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    maxGuests?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    comfortIds?: number[];
}
