import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    Max,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyReviewDto {
    @IsNumber()
    @Type(() => Number)
    propertyId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    @Type(() => String)
    comment: string;
}

export class CreateUserReviewDto {
    @IsNumber()
    @Type(() => Number)
    targetUserId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    @Type(() => String)
    comment: string;
}

export class UpdateReviewDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating?: number;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    @Type(() => String)
    comment?: string;
}
