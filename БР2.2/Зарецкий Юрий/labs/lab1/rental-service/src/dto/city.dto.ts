import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCityDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    name: string;
}

export class UpdateCityDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    name?: string;
}
