import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListPropertiesQueryDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    typeId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    maxPrice?: number;

    @IsOptional()
    @IsArray()
    @Type(() => Number)
    amenityIds?: number[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

export class CreatePropertyDto {
    @IsString()
    @Type(() => String)
    name: string;

    @Type(() => Number)
    @IsInt()
    price: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    deposit?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsString()
    @Type(() => String)
    city: string;

    @IsString()
    @Type(() => String)
    address: string;

    @Type(() => Number)
    @IsInt()
    typeId: number;

    @IsOptional()
    @IsArray()
    @Type(() => Number)
    amenityIds?: number[];
}

export class CreatePhotoDto {
    @IsString()
    @Type(() => String)
    photoAddr: string;
}
