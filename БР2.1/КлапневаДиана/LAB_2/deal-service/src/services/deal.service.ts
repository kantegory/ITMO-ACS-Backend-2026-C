import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Deal } from '../models/Deal.entity';
import { CreateDealDto, UpdateDealDto } from '../dto/deal.dto';

export class DealService {
    private dealRepository: Repository<Deal>;

    constructor() {
        this.dealRepository = AppDataSource.getRepository(Deal);
    }

    async create(createDealDto: CreateDealDto): Promise<Deal> {
        const deal = this.dealRepository.create({
            landlordId: createDealDto.landlord_id,
            tenantId: createDealDto.tenant_id,
            period: createDealDto.period,
            dealStatus: createDealDto.deal_status || 'pending',
            isPublished: createDealDto.is_published || false,
        });
        return await this.dealRepository.save(deal);
    }

    async findAll(): Promise<Deal[]> {
        return await this.dealRepository.find();
    }

    async findOne(id: number): Promise<Deal | null> {
        return await this.dealRepository.findOneBy({ id });
    }

    async findByStatus(status: string): Promise<Deal[]> {
        return await this.dealRepository.findBy({ dealStatus: status });
    }

    async findByLandlord(landlordId: number): Promise<Deal[]> {
        return await this.dealRepository.findBy({ landlordId });
    }

    async findByTenant(tenantId: number): Promise<Deal[]> {
        return await this.dealRepository.findBy({ tenantId });
    }

    async update(id: number, updateDealDto: UpdateDealDto): Promise<Deal | null> {
        const updateData: any = {};

        if (updateDealDto.landlord_id !== undefined) {
            updateData.landlordId = updateDealDto.landlord_id;
        }
        if (updateDealDto.tenant_id !== undefined) {
            updateData.tenantId = updateDealDto.tenant_id;
        }
        if (updateDealDto.period !== undefined) {
            updateData.period = updateDealDto.period;
        }
        if (updateDealDto.deal_status !== undefined) {
            updateData.dealStatus = updateDealDto.deal_status;
        }
        if (updateDealDto.is_published !== undefined) {
            updateData.isPublished = updateDealDto.is_published;
        }

        await this.dealRepository.update(id, updateData);
        return await this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.dealRepository.delete(id);
    }

    async findWithFilters(filters: {
        status?: string;
        landlordId?: number;
        tenantId?: number;
        isPublished?: boolean;
    }): Promise<Deal[]> {
        const where: FindOptionsWhere<Deal> = {};

        if (filters.status) {
            where.dealStatus = filters.status;
        }
        if (filters.landlordId) {
            where.landlordId = filters.landlordId;
        }
        if (filters.tenantId) {
            where.tenantId = filters.tenantId;
        }
        if (filters.isPublished !== undefined) {
            where.isPublished = filters.isPublished;
        }

        return await this.dealRepository.find({ where });
    }
}
