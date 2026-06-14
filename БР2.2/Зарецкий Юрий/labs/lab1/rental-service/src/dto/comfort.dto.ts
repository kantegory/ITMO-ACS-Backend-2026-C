import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComfortDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    icon?: string;
}

export class UpdateComfortDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    icon?: string;
}
