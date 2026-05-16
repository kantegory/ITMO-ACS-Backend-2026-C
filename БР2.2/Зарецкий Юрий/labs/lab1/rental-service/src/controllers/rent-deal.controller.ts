import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    HttpCode,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Not, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { RentDeal, DealStatus } from '../models/rent-deal.entity';
import { CreateRentDealDto, UpdateDealStatusDto } from '../dto/rent-deal.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';

@EntityController({
    baseRoute: '/rent-deals',
    entity: RentDeal,
})
class RentDealController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create rental request', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateRentDealDto }) data: CreateRentDealDto,
    ) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: data.propertyId });
        if (!property) return { message: 'Property not found' };
        if (!property.isActive) return { message: 'Property is not active' };
        if (property.ownerId === request.user.id) {
            return { message: 'Cannot rent your own property' };
        }

        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) return { message: 'End date must be after start date' };

        const totalPrice = days * property.pricePerDay;

        const deal = this.repository.create({
            propertyId: data.propertyId,
            tenantId: request.user.id,
            ownerId: property.ownerId,
            startDate: data.startDate,
            endDate: data.endDate,
            totalPrice,
            comment: data.comment || null,
            status: DealStatus.REQUESTED,
        });

        return await this.repository.save(deal);
    }

    @Get('/check-availability')
    @OpenAPI({ summary: 'Check property availability for dates' })
    async checkAvailability(
        @QueryParam('propertyId') propertyId: number,
        @QueryParam('startDate') startDate: string,
        @QueryParam('endDate') endDate: string,
    ) {
        const conflicts = await this.repository.find({
            where: {
                propertyId,
                status: Not(DealStatus.CANCELLED),
                startDate: LessThanOrEqual(endDate),
                endDate: MoreThanOrEqual(startDate),
            },
        });

        return { available: conflicts.length === 0, conflicts: conflicts.length };
    }

    @Get('/property/:propertyId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Deals for a property', security: [{ bearerAuth: [] }] })
    async getByProperty(
        @Param('propertyId') propertyId: number,
        @Req() request: RequestWithUser,
        @QueryParam('status') status?: string,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const where: any = { propertyId };
        if (status) where.status = status;

        const [data, total] = await this.repository.findAndCount({
            where,
            relations: ['tenant', 'property'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get deal details', security: [{ bearerAuth: [] }] })
    async getById(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const deal = await this.repository.findOne({
            where: { id },
            relations: ['property', 'tenant', 'owner'],
        });
        if (!deal) return { message: 'Deal not found' };
        return deal;
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Approve or cancel deal', security: [{ bearerAuth: [] }] })
    async updateStatus(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateDealStatusDto }) data: UpdateDealStatusDto,
    ) {
        const deal = await this.repository.findOneBy({ id }) as RentDeal;
        if (!deal) return { message: 'Deal not found' };

        if (deal.status !== DealStatus.REQUESTED) {
            return { message: 'Can only update deals with "requested" status' };
        }

        deal.status = data.status as DealStatus;
        if (data.cancellationReason) {
            deal.cancellationReason = data.cancellationReason;
        }

        return await this.repository.save(deal);
    }
}

export default RentDealController;
