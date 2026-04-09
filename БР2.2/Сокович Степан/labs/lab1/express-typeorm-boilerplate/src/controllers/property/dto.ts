import { IsArray, IsInt, IsString, Min, ArrayUnique, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePropertyDto {
    @IsString()
    @Type(() => String)
    name: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    price: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    deposit: number;

    @IsString()
    @Type(() => String)
    description: string;

    @IsString()
    @Type(() => String)
    city: string;

    @IsString()
    @Type(() => String)
    address: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    typeId: number;

    @IsArray()
    @ArrayUnique()
    @Type(() => Number)
    @IsInt({ each: true })
    amenityIds: number[];
}

export class CreatePropertyPhotoDto {
    @IsString()
    @Type(() => String)
    photoAddr: string;
}

export class GetPropertiesQueryDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    typeId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        if (Array.isArray(value)) return value.map((v) => Number(v));
        return [Number(value)];
    })
    @IsArray()
    @IsInt({ each: true })
    amenityIds?: number[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    limit: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset: number = 0;
}

export class PropertyResponseDto {
    id: number;
    createdAt: Date;
    name: string;
    price: number;
    deposit: number;
    description: string;
    ownerId: number;
    city: string;
    address: string;
    typeId: number;
    amenityIds: number[];
}

export class PropertyTypeDto {
    id: number;
    name: string;
}

export class PropertyPhotoDto {
    id: number;
    propertyId: number;
    photoAddr: string;
}

export class PropertyAmenityDto {
    id: number;
    name: string;
}

export class PropertyDetailsResponseDto extends PropertyResponseDto {
    type: PropertyTypeDto | null;
    photos: PropertyPhotoDto[];
    amenities: PropertyAmenityDto[];
}

export class ErrorResponseDto {
    message: string;
    code: string;
}

export class PropertiesListResponseDto {
    data: PropertyResponseDto[];
    total: number;
}
