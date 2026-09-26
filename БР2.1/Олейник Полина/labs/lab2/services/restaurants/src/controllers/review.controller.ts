import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    QueryParams,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
    ForbiddenError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Review } from '../models/review.entity';
import { Restaurant } from '../models/restaurant.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

import {
    ReviewCreateDto,
    ReviewUpdateDto,
    ReviewDto,
    ReviewPageDto,
    toReviewDto,
} from '../dto/review.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { ConflictError } from '../errors/http-errors';
import { getSkipTake, buildPageMeta } from '../utils/pagination';
import { recalculateRating } from '../services/review.service';
import { getUsersShort, UserShort } from '../clients/auth-client';

// Адаптация лр1/src/controllers/review.controller.ts: автор больше не подгружается
// связью (relations: ['user']) — берётся пачкой через auth-client. Единственное
// исключение из общего правила раздела 7: если auth недоступен, отзыв всё равно
// возвращается 200 с user: null (сценарий 8, раздел 10 CLAUDE.md), а не 503/504/500.
async function fetchAuthorsSafe(ids: number[]): Promise<Map<number, UserShort>> {
    try {
        const users = await getUsersShort(ids);
        return new Map(users.map((user) => [user.id, user]));
    } catch (error) {
        console.error('auth-service unavailable, returning reviews without author data', error);
        return new Map();
    }
}

@EntityController({
    entity: Review,
})
class ReviewController extends BaseController {
    // GET /restaurants/{restaurantId}/reviews — публично, с пагинацией
    @Get('/restaurants/:restaurantId/reviews')
    async list(
        @Param('restaurantId') restaurantIdParam: number,
        @QueryParams({ type: PaginationQueryDto }) query: PaginationQueryDto,
    ): Promise<ReviewPageDto> {
        const restaurantId = Number(restaurantIdParam);

        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const { skip, take } = getSkipTake(query.page, query.limit);

        const [items, total] = await this.repository.findAndCount({
            where: { restaurant_id: restaurantId },
            order: { created_at: 'DESC' },
            skip,
            take,
        });

        const reviews = items as Review[];
        const authors = await fetchAuthorsSafe(reviews.map((r) => r.user_id));

        return {
            items: reviews.map((review) =>
                toReviewDto(review, authors.get(review.user_id) ?? null),
            ),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }

    // POST /restaurants/{restaurantId}/reviews — любой авторизованный, один отзыв на ресторан
    @Post('/restaurants/:restaurantId/reviews')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Param('restaurantId') restaurantIdParam: number,
        @Body({ type: ReviewCreateDto }) data: ReviewCreateDto,
    ): Promise<ReviewDto> {
        const restaurantId = Number(restaurantIdParam);

        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const existing = await this.repository.findOneBy({
            restaurant_id: restaurantId,
            user_id: request.user.id,
        });
        if (existing) {
            throw new ConflictError(
                'User has already reviewed this restaurant',
            );
        }

        const review = await dataSource.transaction(async (manager) => {
            const created = manager.getRepository(Review).create({
                restaurant_id: restaurantId,
                user_id: request.user.id,
                rating: data.rating,
                comment: data.comment,
            });
            await manager.getRepository(Review).save(created);
            await recalculateRating(restaurantId, manager);

            return created;
        });

        const authors = await fetchAuthorsSafe([review.user_id]);

        return toReviewDto(review, authors.get(review.user_id) ?? null);
    }

    // PATCH /reviews/{reviewId} — только автор
    @Patch('/reviews/:reviewId')
    @UseBefore(authMiddleware)
    async update(
        @Req() request: RequestWithUser,
        @Param('reviewId') reviewIdParam: number,
        @Body({ type: ReviewUpdateDto }) data: ReviewUpdateDto,
    ): Promise<ReviewDto> {
        const reviewId = Number(reviewIdParam);

        const review = await this.repository.findOneBy({ id: reviewId });
        if (!review) {
            throw new NotFoundError('Review not found');
        }

        if ((review as Review).user_id !== request.user.id) {
            throw new ForbiddenError('Only the author can edit this review');
        }

        await dataSource.transaction(async (manager) => {
            Object.assign(review as Review, data);
            await manager.getRepository(Review).save(review as Review);
            await recalculateRating((review as Review).restaurant_id, manager);
        });

        const authors = await fetchAuthorsSafe([(review as Review).user_id]);

        return toReviewDto(
            review as Review,
            authors.get((review as Review).user_id) ?? null,
        );
    }

    // DELETE /reviews/{reviewId} — автор отзыва или ADMIN
    @Delete('/reviews/:reviewId')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    async remove(
        @Req() request: RequestWithUser,
        @Param('reviewId') reviewIdParam: number,
    ): Promise<void> {
        const reviewId = Number(reviewIdParam);

        const review = await this.repository.findOneBy({ id: reviewId });
        if (!review) {
            throw new NotFoundError('Review not found');
        }

        const typedReview = review as Review;
        const isAuthor = typedReview.user_id === request.user.id;
        const isAdmin = request.user.role === Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenError(
                'Only the author or an admin can delete this review',
            );
        }

        await dataSource.transaction(async (manager) => {
            await manager.getRepository(Review).remove(typedReview);
            await recalculateRating(typedReview.restaurant_id, manager);
        });
    }
}

export default ReviewController;
