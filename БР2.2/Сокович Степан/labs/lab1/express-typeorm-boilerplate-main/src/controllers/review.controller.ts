import {
    BadRequestError,
    Body,
    NotFoundError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Review } from '../models/review.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { CreateReviewDto } from '../dto/review.dto';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { Deal } from '../models/deal.entity';
import { DealStatus } from '../models/enums';

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewController extends BaseController {
    @Post('')
    @UseBefore(authMiddleware)
    async create(
        @Body({ type: CreateReviewDto }) payload: CreateReviewDto,
        @Req() request: RequestWithUser,
    ) {
        if (payload.targetId === request.user.id) {
            throw new BadRequestError('You cannot leave a review to yourself');
        }

        const userRepository = dataSource.getRepository(User);
        const target = await userRepository.findOneBy({ id: payload.targetId });
        if (!target) {
            throw new NotFoundError('Target user is not found');
        }

        const dealRepository = dataSource.getRepository(Deal);
        const finishedDeal = await dealRepository
            .createQueryBuilder('deal')
            .where(
                '(deal.landlord_id = :me AND deal.tenant_id = :target) OR (deal.landlord_id = :target AND deal.tenant_id = :me)',
                {
                    me: request.user.id,
                    target: payload.targetId,
                },
            )
            .andWhere('deal.status = :status', { status: DealStatus.CONFIRMED })
            .getOne();

        if (!finishedDeal) {
            throw new BadRequestError(
                'Review is allowed only for users with confirmed deal',
            );
        }

        const review = this.repository.create({
            authorId: request.user.id,
            targetId: payload.targetId,
            rating: payload.rating,
            text: payload.text || null,
        });

        return await this.repository.save(review);
    }
}

export default ReviewController;
