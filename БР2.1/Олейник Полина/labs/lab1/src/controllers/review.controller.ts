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
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

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
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';
import { getSkipTake, buildPageMeta } from '../utils/pagination';
import { recalculateRating } from '../services/review.service';

// Отзывы устроены необычно с точки зрения путей: список и создание висят на
// /restaurants/{restaurantId}/reviews, а изменение/удаление — на /reviews/{reviewId}
// (отдельный корень, не вложенный в ресторан). Поэтому у @EntityController ниже
// НЕТ baseRoute — вместо этого каждый метод сам пишет свой полный путь.
@EntityController({
    entity: Review,
})
class ReviewController extends BaseController {
    // GET /restaurants/{restaurantId}/reviews — публично, с пагинацией
    @Get('/restaurants/:restaurantId/reviews')
    @OpenAPI({ summary: 'Отзывы о ресторане' })
    @ResponseSchema(ReviewPageDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantIdParam: number,
        @QueryParams({ type: PaginationQueryDto }) query: PaginationQueryDto,
    ): Promise<ReviewPageDto> {
        const restaurantId = Number(restaurantIdParam); // параметр из URL — строка, приводим к числу

        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const { skip, take } = getSkipTake(query.page, query.limit);

        const [items, total] = await this.repository.findAndCount({
            where: { restaurant_id: restaurantId },
            relations: ['user'], // без этого отзыв не знал бы, кто его автор (для UserShortDto в ответе)
            order: { created_at: 'DESC' }, // от новых к старым
            skip,
            take,
        });

        return {
            items: (items as Review[]).map(toReviewDto),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }

    // POST /restaurants/{restaurantId}/reviews — любой авторизованный пользователь,
    // но только один отзыв на ресторан от одного человека
    @Post('/restaurants/:restaurantId/reviews')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Оставить отзыв' })
    @ResponseSchema(ReviewDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        // Транзакция: создание отзыва и пересчёт рейтинга ресторана должны либо
        // выполниться ОБА, либо ни один. Если бы рейтинг пересчитывался отдельным
        // запросом после этого блока, при сбое между ними рейтинг бы "разъехался"
        // с реальным списком отзывов.
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

        const saved = await this.repository.findOne({
            where: { id: review.id },
            relations: ['user'],
        });

        return toReviewDto(saved as Review);
    }

    // PATCH /reviews/{reviewId} — только автор
    @Patch('/reviews/:reviewId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить свой отзыв' })
    @ResponseSchema(ReviewDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 403 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
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
            await recalculateRating( // рейтинг после изменения оценки нужно пересчитать заново
                (review as Review).restaurant_id,
                manager,
            );
        });

        const saved = await this.repository.findOne({
            where: { id: reviewId },
            relations: ['user'],
        });

        return toReviewDto(saved as Review);
    }

    // DELETE /reviews/{reviewId} — автор отзыва или ADMIN
    @Delete('/reviews/:reviewId')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Удалить отзыв' })
    @ResponseSchema(ErrorDto, { statusCode: 403 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
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
            await recalculateRating(typedReview.restaurant_id, manager); // отзыва больше нет — рейтинг должен это учесть
        });
    }
}

export default ReviewController;
