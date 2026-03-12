import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Patch,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Deal } from '../models/deal.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { CreateDealDto, UpdateDealStatusDto } from '../dto/deal.dto';
import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';
import { User } from '../models/user.entity';

@EntityController({
    baseRoute: '/deals',
    entity: Deal,
})
class DealController extends BaseController {
    @Get('')
    @UseBefore(authMiddleware)
    async list(@Req() request: RequestWithUser) {
        const data = await this.repository.find({
            where: [
                { landlordId: request.user.id },
                { tenantId: request.user.id },
            ],
            order: { id: 'DESC' },
        });

        return { data };
    }

    @Post('')
    @UseBefore(authMiddleware)
    async create(
        @Body({ type: CreateDealDto }) payload: CreateDealDto,
        @Req() request: RequestWithUser,
    ) {
        if (request.user.id !== payload.tenantId && request.user.id !== payload.landlordId) {
            throw new ForbiddenError('You can create only your own deals');
        }

        if (payload.startTime >= payload.endTime) {
            throw new BadRequestError('startTime should be less than endTime');
        }

        const propertyRepository = dataSource.getRepository(Property);
        const property = await propertyRepository.findOneBy({ id: payload.estateId });
        if (!property) {
            throw new NotFoundError('Property is not found');
        }

        const userRepository = dataSource.getRepository(User);
        const [landlord, tenant] = await Promise.all([
            userRepository.findOneBy({ id: payload.landlordId }),
            userRepository.findOneBy({ id: payload.tenantId }),
        ]);

        if (!landlord || !tenant) {
            throw new NotFoundError('Tenant or landlord is not found');
        }

        const deal = this.repository.create({
            landlordId: payload.landlordId,
            tenantId: payload.tenantId,
            estateId: payload.estateId,
            startTime: new Date(payload.startTime),
            endTime: new Date(payload.endTime),
        });

        return await this.repository.save(deal);
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    async updateStatus(
        @Param('id') id: number,
        @Body({ type: UpdateDealStatusDto }) payload: UpdateDealStatusDto,
        @Req() request: RequestWithUser,
    ) {
        const deal = (await this.repository.findOneBy({ id })) as Deal | null;
        if (!deal) {
            throw new NotFoundError('Deal is not found');
        }

        if (deal.landlordId !== request.user.id && deal.tenantId !== request.user.id) {
            throw new ForbiddenError('You are not participant of this deal');
        }

        deal.status = payload.status;
        return await this.repository.save(deal);
    }
}

export default DealController;
