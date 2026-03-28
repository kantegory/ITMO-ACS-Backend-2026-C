import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    Delete,
    HttpCode,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Review } from '../models/review.entity';
import {
    CreatePropertyReviewDto,
    CreateUserReviewDto,
    UpdateReviewDto,
} from '../dto/review.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewController extends BaseController {
    @Get('/property/:propertyId')
    @OpenAPI({ summary: 'Reviews for a property' })
    async getPropertyReviews(
        @Param('propertyId') propertyId: number,
        @QueryParam('sortBy') sortBy: string = 'createdAt',
        @QueryParam('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const allowedSortFields = ['createdAt', 'rating'];
        const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

        const [data, total] = await this.repository.findAndCount({
            where: { propertyId },
            relations: ['author'],
            order: { [actualSortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/user/:userId')
    @OpenAPI({ summary: 'Reviews for a user' })
    async getUserReviews(
        @Param('userId') userId: number,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const [data, total] = await this.repository.findAndCount({
            where: { targetUserId: userId },
            relations: ['author'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/my')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'My authored reviews', security: [{ bearerAuth: [] }] })
    async getMyReviews(
        @Req() request: RequestWithUser,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const [data, total] = await this.repository.findAndCount({
            where: { authorId: request.user.id },
            relations: ['property', 'targetUser'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get review by ID' })
    async getById(@Param('id') id: number) {
        const review = await this.repository.findOne({
            where: { id },
            relations: ['author', 'property', 'targetUser'],
        });
        if (!review) return { message: 'Review not found' };
        return review;
    }

    @Post('/property')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create property review', security: [{ bearerAuth: [] }] })
    async createPropertyReview(
        @Req() request: RequestWithUser,
        @Body({ type: CreatePropertyReviewDto }) data: CreatePropertyReviewDto,
    ) {
        const review = this.repository.create({
            propertyId: data.propertyId,
            authorId: request.user.id,
            rating: data.rating,
            comment: data.comment,
        });

        return await this.repository.save(review);
    }

    @Post('/user')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create user review', security: [{ bearerAuth: [] }] })
    async createUserReview(
        @Req() request: RequestWithUser,
        @Body({ type: CreateUserReviewDto }) data: CreateUserReviewDto,
    ) {
        if (data.targetUserId === request.user.id) {
            return { message: 'Cannot review yourself' };
        }

        const review = this.repository.create({
            targetUserId: data.targetUserId,
            authorId: request.user.id,
            rating: data.rating,
            comment: data.comment,
        });

        return await this.repository.save(review);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update own review', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateReviewDto }) data: UpdateReviewDto,
    ) {
        const review = await this.repository.findOneBy({ id }) as Review;
        if (!review) return { message: 'Review not found' };
        if (review.authorId !== request.user.id) {
            return { message: 'Forbidden: not the author' };
        }

        Object.assign(review, data);
        return await this.repository.save(review);
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete own review', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const review = await this.repository.findOneBy({ id }) as Review;
        if (!review) return { message: 'Review not found' };
        if (review.authorId !== request.user.id) {
            return { message: 'Forbidden: not the author' };
        }

        await this.repository.remove(review);
        return '';
    }
}

export default ReviewController;
