import { Body, Get, HttpCode, HttpError, Param, Patch, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import dataSource from '../../config/data-source';
import { Deal, DealStatus } from '../../models/deal.entity';
import { EstateForRent } from '../../models/estate-for-rent.entity';
import { User, UserType } from '../../models/user.entity';
import {
    ApiDealStatus,
    CreateDealDto,
    DealResponseDto,
    DealsListResponseDto,
    ErrorResponseDto,
    UpdateDealStatusDto,
} from './dto';

const modelToApiStatus: Record<DealStatus, ApiDealStatus> = {
    [DealStatus.REQUESTED]: ApiDealStatus.REQUESTED,
    [DealStatus.CONFIRMED]: ApiDealStatus.CONFIRMED,
    [DealStatus.CANCELLED]: ApiDealStatus.CANCELLED,
};

const apiToModelStatus: Record<ApiDealStatus, DealStatus> = {
    [ApiDealStatus.REQUESTED]: DealStatus.REQUESTED,
    [ApiDealStatus.CONFIRMED]: DealStatus.CONFIRMED,
    [ApiDealStatus.CANCELLED]: DealStatus.CANCELLED,
};

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
                id: Number(deal.id),
                createdAt: deal.createdAt,
                landlordId: Number(deal.landlordId),
                tenantId: Number(deal.tenantId),
                startTime: deal.startTime,
                endTime: deal.endTime,
                estateId: Number(deal.estateId),
                status: modelToApiStatus[deal.status],
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
        @Body({ type: CreateDealDto }) body: CreateDealDto,
    ): Promise<DealResponseDto> {
        const { estateId, landlordId, tenantId, startTime, endTime } = body;

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
            throw new HttpError(400, 'Время начала должно быть раньше времени окончания');
        }

        if (landlordId === tenantId) {
            throw new HttpError(400, 'Идентификаторы арендодателя и арендатора должны отличаться');
        }

        const userRepository = dataSource.getRepository(User);
        const estateRepository = dataSource.getRepository(EstateForRent);

        const [landlord, tenant, estate] = await Promise.all([
            userRepository.findOneBy({ id: String(landlordId) }),
            userRepository.findOneBy({ id: String(tenantId) }),
            estateRepository.findOneBy({ id: String(estateId) }),
        ]);

        if (!landlord || !tenant || !estate) {
            throw new HttpError(400, 'Некорректный идентификатор арендодателя, арендатора или недвижимости');
        }

        if (landlord.type !== UserType.LANDLORD || tenant.type !== UserType.TENANT) {
            throw new HttpError(400, 'Некорректные роли пользователей для сделки');
        }

        if (estate.ownerId !== String(landlordId)) {
            throw new HttpError(400, 'Объект недвижимости не принадлежит указанному арендодателю');
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
            throw new HttpError(409, 'Время сделки пересекается с уже существующей бронью');
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
            id: Number(savedDeal.id),
            createdAt: savedDeal.createdAt,
            landlordId: Number(savedDeal.landlordId),
            tenantId: Number(savedDeal.tenantId),
            startTime: savedDeal.startTime,
            endTime: savedDeal.endTime,
            estateId: Number(savedDeal.estateId),
            status: modelToApiStatus[savedDeal.status],
        };
    }

    @Patch('/:id/status')
    @OpenAPI({ summary: 'Обновить статус сделки' })
    @ResponseSchema(DealResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async updateDealStatus(
        @Param('id') id: number,
        @Body({ type: UpdateDealStatusDto }) body: UpdateDealStatusDto,
    ): Promise<DealResponseDto> {
        const deal = await this.repository.findOneBy({ id: String(id) }) as Deal | null;
        if (!deal) {
            throw new HttpError(404, 'Сделка не найдена');
        }

        deal.status = apiToModelStatus[body.status];
        const updatedDeal = await this.repository.save(deal) as Deal;

        return {
            id: Number(updatedDeal.id),
            createdAt: updatedDeal.createdAt,
            landlordId: Number(updatedDeal.landlordId),
            tenantId: Number(updatedDeal.tenantId),
            startTime: updatedDeal.startTime,
            endTime: updatedDeal.endTime,
            estateId: Number(updatedDeal.estateId),
            status: modelToApiStatus[updatedDeal.status],
        };
    }
}

export default DealsController;
