import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
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

export class ReviewResponseDto {
    id: string;
    authorId: string;
    targetId: string;
    rating: number;
    createdAt: Date;
    text: string;
}

export class ReviewsListResponseDto {
    data: ReviewResponseDto[];
}

export class ErrorResponseDto {
    message: string;
    code: string;
}
