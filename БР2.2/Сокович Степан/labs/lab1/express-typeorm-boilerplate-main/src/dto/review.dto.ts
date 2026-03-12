import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @Type(() => Number)
    @IsInt()
    targetId: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    text?: string;
}
