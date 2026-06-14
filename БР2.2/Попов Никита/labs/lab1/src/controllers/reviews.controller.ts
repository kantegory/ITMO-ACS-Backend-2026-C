import "reflect-metadata";
import {
    Get,
    Post,
    Param,
    QueryParams,
    Body,
    UseBefore,
    Req,
    JsonController,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import {
    IsInt,
    IsOptional,
    IsString,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

import dataSource from '../config/data-source';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { Review } from '../models/review.entity';
import { Restaurant } from '../models/restaurant.entity';

class PaginationQuery {
    @IsInt()
    @Type(() => Number)
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @IsInt()
    @Type(() => Number)
    @Min(1)
    @IsOptional()
    pageSize?: number = 20;
}

class ListReviewsQuery extends PaginationQuery {
    @IsString()
    @IsOptional()
    sortBy?: 'rating' | 'createdAt';

    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC';
}

class CreateReviewDto {
    @IsInt()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

class PaginatedReviewsDto {
    @Type(() => Review)
    items: Review[];

    total: number;
    page: number;
    pageSize: number;
}

class ListReviewsResponseDto {
    data: PaginatedReviewsDto;
}

class ReviewResponseDto {
    @Type(() => Review)
    data: Review;
}

@JsonController('/restaurants')
export class ReviewsController {
    private reviewRepo = dataSource.getRepository(Review);
    private restaurantRepo = dataSource.getRepository(Restaurant);

    @Get('/:restaurantId/reviews')
    @OpenAPI({ summary: 'Список отзывов ресторана' })
    @ResponseSchema(ListReviewsResponseDto, { statusCode: 200 })
    async list(
        @Param('restaurantId') restaurantId: string,
        @QueryParams({ type: ListReviewsQuery }) query: ListReviewsQuery,
    ): Promise<ListReviewsResponseDto> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;

        const qb = this.reviewRepo
            .createQueryBuilder('review')
            .where('review.restaurantId = :restaurantId', { restaurantId });

        if (query.sortBy) {
            qb.orderBy(
                `review.${query.sortBy}`,
                (query.sortOrder || 'ASC') as 'ASC' | 'DESC',
            );
        }

        qb.skip((page - 1) * pageSize).take(pageSize);

        const [items, total] = await qb.getManyAndCount();

        return {
            data: {
                items,
                total,
                page,
                pageSize,
            },
        };
    }

    @Post('/:restaurantId/reviews')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создание отзыва' })
    @ResponseSchema(ReviewResponseDto, { statusCode: 200 })
    async create(
        @Param('restaurantId') restaurantId: string,
        @Req() request: RequestWithUser,
        @Body({ type: CreateReviewDto }) body: CreateReviewDto,
    ): Promise<ReviewResponseDto> {
        const { user } = request;

        const review = this.reviewRepo.create({
            restaurantId,
            userId: user.id,
            rating: body.rating,
            comment: body.comment,
        });

        const saved = await this.reviewRepo.save(review);

        // простое обновление среднего рейтинга ресторана
        const [allReviews, count] = await this.reviewRepo.findAndCount({
            where: { restaurantId },
        });

        if (count > 0) {
            const avg =
                allReviews.reduce((sum, r) => sum + r.rating, 0) / count;
            await this.restaurantRepo.update(
                { id: restaurantId },
                { rating: avg },
            );
        }

        return { data: saved };
    }
}

