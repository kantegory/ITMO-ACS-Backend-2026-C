import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

import { Review } from '../models/review.entity';
import { UserShortDto, toUserShortDto } from './user-short.dto';
import { UserShort } from '../clients/auth-client';
import { PageMetaDto } from './pagination.dto';

// Адаптация лр1/src/dto/review.dto.ts: у restaurants нет своей сущности User,
// автор передаётся отдельно (пачкой через auth-client). `user` — nullable:
// сценарий 8 раздела 10 CLAUDE.md — если auth недоступен, отзыв всё равно
// возвращается (200), просто без данных автора.
class ReviewCreateDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

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

class ReviewDto {
    id: number;
    restaurant_id: number;
    user_id: number;
    user: UserShortDto | null;
    rating: number;
    comment: string | null;
    created_at: Date;
    updated_at: Date;
}

class ReviewPageDto {
    items: ReviewDto[];
    meta: PageMetaDto;
}

function toReviewDto(review: Review, user: UserShort | null): ReviewDto {
    return {
        id: review.id,
        restaurant_id: review.restaurant_id,
        user_id: review.user_id,
        user: user ? toUserShortDto(user) : null,
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
