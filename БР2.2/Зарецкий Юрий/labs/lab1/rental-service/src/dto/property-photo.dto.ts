import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyPhotoDto {
    @IsString()
    @Type(() => String)
    url: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isMain?: boolean;
}

export class UpdatePropertyPhotoDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isMain?: boolean;
}
