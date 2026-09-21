import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

import { Review } from '../models/review.entity';
import { UserShortDto, toUserShortDto } from './user.dto';
import { PageMetaDto } from './pagination.dto';

// Тело запроса POST /restaurants/{id}/reviews
class ReviewCreateDto {
    @IsInt()
    @Min(1)
    @Max(5) // оценка строго от 1 до 5
    @Type(() => Number)
    rating: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

// Тело запроса PATCH /reviews/{id}
class ReviewUpdateDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

// Форма отзыва в ответах — вместе с короткими данными автора (имя, фамилия)
class ReviewDto {
    id: number;
    restaurant_id: number;
    user_id: number;
    user: UserShortDto;
    rating: number;
    comment: string | null;
    created_at: Date;
    updated_at: Date;
}

class ReviewPageDto {
    items: ReviewDto[];
    meta: PageMetaDto;
}

function toReviewDto(review: Review): ReviewDto {
    return {
        id: review.id,
        restaurant_id: review.restaurant_id,
        user_id: review.user_id,
        user: toUserShortDto(review.user), // review.user должен быть заранее подгружен (relations: ['user'])
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
    };
}

export {
    ReviewCreateDto,
    ReviewUpdateDto,
    ReviewDto,
    ReviewPageDto,
    toReviewDto,
};
