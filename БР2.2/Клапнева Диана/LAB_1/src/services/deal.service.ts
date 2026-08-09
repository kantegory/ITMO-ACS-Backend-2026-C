import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Deal } from '../models/Deal.entity';
import { CreateDealDto, UpdateDealDto } from '../dto/deal.dto';

export class DealService {
    private dealRepository: Repository<Deal>;

    constructor() {
        this.dealRepository = AppDataSource.getRepository(Deal);
    }

    async findAll(): Promise<Deal[]> {
        return await this.dealRepository.find({ relations: ['estates'] });
    }

    async findById(id: number): Promise<Deal | null> {
        return await this.dealRepository.findOne({
            where: { id },
            relations: ['estates']
        });
    }

    async create(data: CreateDealDto): Promise<Deal> {
        const deal = this.dealRepository.create(data);
        return await this.dealRepository.save(deal);
    }

    async update(id: number, data: UpdateDealDto): Promise<Deal | null> {
        const deal = await this.dealRepository.findOneBy({ id });
        if (!deal) return null;

        Object.assign(deal, data);
        return await this.dealRepository.save(deal);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.dealRepository.delete(id);
        // Исправлено: проверка на null
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
}
