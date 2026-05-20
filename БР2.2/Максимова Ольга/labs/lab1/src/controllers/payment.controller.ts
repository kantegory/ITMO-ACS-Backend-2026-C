import {
    Get,
    Post,
    Param,
    Body,
    QueryParams,
    Req,
    UseBefore,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import { Payment } from '../models/payment.entity';
import { Rent } from '../models/rent.entity';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { CreatePaymentRequest, PaymentsListQueryDto } from '../dto/payment';

@EntityController({ baseRoute: '/payments', entity: Payment })
@UseBefore(authMiddleware)
export default class PaymentsController extends BaseController {
    @Get('/')
    @OpenAPI({
        summary: 'List payments',
        tags: ['Payment'],
        security: [{ bearerAuth: [] }],
    })
    async list(
        @Req() req: RequestWithUser,
        @QueryParams() query: PaymentsListQueryDto,
    ) {
        const { page = 1, limit = 10, sort = 'created_at' } = query;

        const rentRepo = dataSource.getRepository(Rent);
        const userRents = await rentRepo.find({
            where: [{ tenant_id: req.user.id }, { landlord_id: req.user.id }],
            select: ['id'],
        });

        const rentIds = userRents.map((rent) => rent.id);

        const [items, total] = await this.repository.findAndCount({
            where: { rent_id: In(rentIds) },
            take: limit,
            skip: (page - 1) * limit,
            order: { [sort]: 'DESC' },
            relations: ['rent'],
        });

        return { items, total, page, limit };
    }

    @Get('/:id')
    @OpenAPI({
        summary: 'Get payment by ID',
        tags: ['Payment'],
        security: [{ bearerAuth: [] }],
    })
    async read(@Req() req: RequestWithUser, @Param('id') id: number) {
        const payment = await this.repository.findOne({
            where: { id },
            relations: ['rent'],
        });

        if (!payment) throw new NotFoundError('Payment not found');

        const rentRepo = dataSource.getRepository(Rent);
        const rent = await rentRepo.findOne({ where: { id: payment.rent_id } });

        if (
            !rent ||
            (rent.tenant_id !== req.user.id && rent.landlord_id !== req.user.id)
        ) {
            throw new UnauthorizedError('Access denied');
        }

        return { payment };
    }

    @Post('/')
    @OpenAPI({
        summary: 'Create payment',
        tags: ['Payment'],
        security: [{ bearerAuth: [] }],
    })
    async create(
        @Req() req: RequestWithUser,
        @Body() body: CreatePaymentRequest,
    ) {
        const rentRepo = dataSource.getRepository(Rent);
        const rent = await rentRepo.findOne({ where: { id: body.rent_id } });

        if (!rent) {
            throw new NotFoundError('Rent not found');
        }

        const payment = this.repository.create({
            rent_id: body.rent_id,
            amount: body.amount,
            status: 'pending',
            created_at: new Date(),
        });

        const savedPayment = await this.repository.save(payment);

        return { payment: savedPayment };
    }

    @Get('/rent/:rentId')
    @OpenAPI({
        summary: 'Get payments by rent',
        tags: ['Payment'],
        security: [{ bearerAuth: [] }],
    })
    async byRent(@Req() req: RequestWithUser, @Param('rentId') rentId: number) {
        const rentRepo = dataSource.getRepository(Rent);
        const rent = await rentRepo.findOne({ where: { id: rentId } });

        if (
            !rent ||
            (rent.tenant_id !== req.user.id && rent.landlord_id !== req.user.id)
        ) {
            throw new UnauthorizedError('Rent access denied');
        }

        const payments = await this.repository.find({
            where: { rent_id: rentId },
            relations: ['rent'],
            order: { created_at: 'DESC' },
        });

        return {
            items: payments,
            total: payments.length,
            page: 1,
            limit: payments.length,
        };
    }
}
