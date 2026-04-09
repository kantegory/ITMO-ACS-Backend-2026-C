import { Body, HttpCode, HttpError, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import dataSource from '../../config/data-source';
import authMiddleware, { RequestWithUser } from '../../middlewares/auth.middleware';
import { Review } from '../../models/review.entity';
import { User } from '../../models/user.entity';
import { CreateReviewDto, ErrorResponseDto, ReviewResponseDto } from './dto';

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewsController extends BaseController {
    @Post('/')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать отзыв' })
    @ResponseSchema(ReviewResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async createReview(
        @Body({ type: CreateReviewDto }) body: CreateReviewDto,
        @Req() request: RequestWithUser,
    ): Promise<ReviewResponseDto> {
        const authorId = String(request.user?.id ?? '');
        if (!authorId) {
            throw new HttpError(400, 'Автор не определен');
        }

        const targetId = String(body.targetId);
        if (authorId === targetId) {
            throw new HttpError(400, 'Нельзя оставить отзыв самому себе');
        }

        const userRepository = dataSource.getRepository(User);
        const [author, target] = await Promise.all([
            userRepository.findOneBy({ id: authorId }),
            userRepository.findOneBy({ id: targetId }),
        ]);

        if (!author || !target) {
            throw new HttpError(400, 'Некорректный идентификатор автора или получателя отзыва');
        }

        const review = this.repository.create({
            authorId,
            targetId,
            rating: String(body.rating),
            text: body.text ?? '',
        });

        const savedReview = await this.repository.save(review) as Review;

        return {
            id: Number(savedReview.id),
            authorId: Number(savedReview.authorId),
            targetId: Number(savedReview.targetId),
            rating: Number(savedReview.rating),
            createdAt: savedReview.createdAt,
            text: savedReview.text,
        };
    }
}

export default ReviewsController;
