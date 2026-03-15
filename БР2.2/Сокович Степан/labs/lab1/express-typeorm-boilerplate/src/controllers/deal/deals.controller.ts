import { Body, Get, HttpCode, HttpError, Param, Patch, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import dataSource from '../../config/data-source';
import { Deal, DealStatus } from '../../models/deal.entity';
import { EstateForRent } from '../../models/estate-for-rent.entity';
import { User, UserType } from '../../models/user.entity';
import {
    CreateDealDto,
    DealResponseDto,
    DealsListResponseDto,
    ErrorResponseDto,
    UpdateDealStatusDto,
} from './dto';

@EntityController({
    baseRoute: '/deals',
    entity: Deal,
})
class DealsController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Получить список сделок' })
    @ResponseSchema(DealsListResponseDto, { statusCode: 200 })
    async getDeals(): Promise<DealsListResponseDto> {
        const deals = await this.repository.find() as Deal[];

        return {
            data: deals.map((deal) => ({
                id: deal.id,
                createdAt: deal.createdAt,
                landlordId: deal.landlordId,
                tenantId: deal.tenantId,
                startTime: deal.startTime,
                endTime: deal.endTime,
                estateId: deal.estateId,
                status: deal.status,
            })),
        };
    }

    @Post('/')
    @HttpCode(201)
    @OpenAPI({ summary: 'Создать заявку на сделку' })
    @ResponseSchema(DealResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async createDeal(
        @Body() body: CreateDealDto,
    ): Promise<DealResponseDto> {
        const { estateId, landlordId, tenantId, startTime, endTime } = body;

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
            throw new HttpError(400, 'startTime must be earlier than endTime');
        }

        if (landlordId === tenantId) {
            throw new HttpError(400, 'landlordId and tenantId must be different');
        }

        const userRepository = dataSource.getRepository(User);
        const estateRepository = dataSource.getRepository(EstateForRent);

        const [landlord, tenant, estate] = await Promise.all([
            userRepository.findOneBy({ id: String(landlordId) }),
            userRepository.findOneBy({ id: String(tenantId) }),
            estateRepository.findOneBy({ id: String(estateId) }),
        ]);

        if (!landlord || !tenant || !estate) {
            throw new HttpError(400, 'landlordId, tenantId or estateId is invalid');
        }

        if (landlord.type !== UserType.LANDLORD || tenant.type !== UserType.TENANT) {
            throw new HttpError(400, 'Invalid user roles for deal participants');
        }

        if (estate.ownerId !== String(landlordId)) {
            throw new HttpError(400, 'estate does not belong to landlordId');
        }

        const activeStatuses = [DealStatus.REQUESTED, DealStatus.CONFIRMED];
        const overlappingDeal = await this.repository
            .createQueryBuilder('deal')
            .where('deal.estate_id = :estateId', { estateId: String(estateId) })
            .andWhere('deal.status IN (:...activeStatuses)', { activeStatuses })
            .andWhere(':startTime < deal.end_time AND :endTime > deal.start_time', {
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            })
            .getOne();

        if (overlappingDeal) {
            throw new HttpError(409, 'Deal time conflicts with an existing booking');
        }

        const deal = this.repository.create({
            estateId: String(estateId),
            landlordId: String(landlordId),
            tenantId: String(tenantId),
            startTime: startDate,
            endTime: endDate,
            status: DealStatus.REQUESTED,
        });

        const savedDeal = await this.repository.save(deal) as Deal;

        return {
            id: savedDeal.id,
            createdAt: savedDeal.createdAt,
            landlordId: savedDeal.landlordId,
            tenantId: savedDeal.tenantId,
            startTime: savedDeal.startTime,
            endTime: savedDeal.endTime,
            estateId: savedDeal.estateId,
            status: savedDeal.status,
        };
    }

    @Patch('/:id/status')
    @OpenAPI({ summary: 'Обновить статус сделки' })
    @ResponseSchema(DealResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async updateDealStatus(
        @Param('id') id: number,
        @Body() body: UpdateDealStatusDto,
    ): Promise<DealResponseDto> {
        const deal = await this.repository.findOneBy({ id: String(id) }) as Deal | null;
        if (!deal) {
            throw new HttpError(404, 'Deal not found');
        }

        deal.status = body.status;
        const updatedDeal = await this.repository.save(deal) as Deal;

        return {
            id: updatedDeal.id,
            createdAt: updatedDeal.createdAt,
            landlordId: updatedDeal.landlordId,
            tenantId: updatedDeal.tenantId,
            startTime: updatedDeal.startTime,
            endTime: updatedDeal.endTime,
            estateId: updatedDeal.estateId,
            status: updatedDeal.status,
        };
    }
}

export default DealsController;
