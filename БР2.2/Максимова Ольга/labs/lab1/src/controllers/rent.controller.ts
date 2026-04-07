import {
    Get,
    Post,
    Patch,
    Param,
    Body,
    QueryParams,
    Req,
    UseBefore,
    NotFoundError,
    UnauthorizedError,
    BadRequestError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { Rent, RentStatus } from '../models/rent.entity';
import { Accommodation } from '../models/accommodation.entity';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import {
    CreateRentRequest,
    UpdateRentStatusRequest,
    RentsListQueryDto,
} from '../dto/rent';

@EntityController({ baseRoute: '/rents', entity: Rent })
export default class RentsController extends BaseController {
    @Get('/')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'List user rents',
        tags: ['Rent'],
        security: [{ bearerAuth: [] }],
    })
    async list(
        @Req() req: RequestWithUser,
        @QueryParams() query: RentsListQueryDto,
    ) {
        const { page = 1, limit = 10, sort = 'created_at' } = query;

        const [items, total] = await this.repository.findAndCount({
            where: [{ tenant_id: req.user.id }, { landlord_id: req.user.id }],
            take: limit,
            skip: (page - 1) * limit,
            order: { [sort]: 'DESC' },
            relations: ['tenant', 'landlord', 'accommodation'],
        });

        return { items, total, page, limit };
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Get rent by ID',
        tags: ['Rent'],
        security: [{ bearerAuth: [] }],
    })
    async read(@Req() req: RequestWithUser, @Param('id') id: number) {
        const rent = await this.repository.findOne({
            where: { id },
            relations: ['tenant', 'landlord', 'accommodation'],
        });

        if (!rent) throw new NotFoundError('Rent not found');
        if (
            rent.tenant_id !== req.user.id &&
            rent.landlord_id !== req.user.id
        ) {
            throw new UnauthorizedError('Access denied');
        }

        return {
            rent,
            accommodation: rent.accommodation,
            tenant: rent.tenant,
            landlord: rent.landlord,
        };
    }

    @Post('/')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Create new rent',
        tags: ['Rent'],
        security: [{ bearerAuth: [] }],
    })
    async create(@Req() req: RequestWithUser, @Body() body: CreateRentRequest) {
        const accomRepo = dataSource.getRepository(Accommodation);
        const accommodation = await accomRepo.findOne({
            where: { id: body.accom_id },
        });

        if (!accommodation) {
            throw new NotFoundError('Accommodation not found');
        }

        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);

        if (endDate <= startDate) {
            throw new BadRequestError('End date must be after start date');
        }

        const rent = this.repository.create({
            accom_id: body.accom_id,
            tenant_id: req.user.id,
            landlord_id: accommodation.landlord_id,
            start_date: startDate,
            end_date: endDate,
            rent_status: RentStatus.ONGOING,
        });

        const savedRent = await this.repository.save(rent);

        const fullRent = await this.repository.findOne({
            where: { id: savedRent.id },
            relations: ['tenant', 'landlord', 'accommodation'],
        });

        return {
            rent: fullRent,
            accommodation: fullRent!.accommodation,
            tenant: fullRent!.tenant,
            landlord: fullRent!.landlord,
        };
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Update rent status',
        tags: ['Rent'],
        security: [{ bearerAuth: [] }],
    })
    async update(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() body: UpdateRentStatusRequest,
    ) {
        const rent = await this.repository.findOne({
            where: { id },
            relations: ['landlord'],
        });

        if (!rent) throw new NotFoundError('Rent not found');
        if (rent.landlord_id !== req.user.id) {
            throw new UnauthorizedError('Only landlord can update rent status');
        }

        rent.rent_status = body.status as RentStatus;
        const updatedRent = await this.repository.save(rent);

        const fullRent = await this.repository.findOne({
            where: { id: updatedRent.id },
            relations: ['tenant', 'landlord', 'accommodation'],
        });

        return {
            rent: fullRent,
            accommodation: fullRent!.accommodation,
            tenant: fullRent!.tenant,
            landlord: fullRent!.landlord,
        };
    }

    @Get('/accommodation/:accomId')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Get rents by accommodation',
        tags: ['Rent'],
        security: [{ bearerAuth: [] }],
    })
    async byAccommodation(
        @Req() req: RequestWithUser,
        @Param('accomId') accomId: number,
    ) {
        const accomRepo = dataSource.getRepository(Accommodation);
        const accommodation = await accomRepo.findOne({
            where: { id: accomId, landlord_id: req.user.id },
        });

        if (!accommodation) {
            throw new UnauthorizedError('Accommodation access denied');
        }

        const rents = await this.repository.find({
            where: { accom_id: accomId },
            relations: ['tenant', 'landlord', 'accommodation'],
            order: { created_at: 'DESC' },
        });

        return {
            items: rents.map((rent) => ({
                rent: rent,
                accommodation: rent.accommodation,
                tenant: rent.tenant,
                landlord: rent.landlord,
            })),
            total: rents.length,
            page: 1,
            limit: rents.length,
        };
    }
}
