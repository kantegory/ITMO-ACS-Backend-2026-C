import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Estate } from '../models/Estate.entity';
import { CreateEstateDto, UpdateEstateDto } from '../dto/estate.dto';

export class EstateService {
    private estateRepository: Repository<Estate>;

    constructor() {
        this.estateRepository = AppDataSource.getRepository(Estate);
    }

    async findAll(): Promise<Estate[]> {
        return await this.estateRepository.find();
    }

    async findById(id: number): Promise<Estate | null> {
        return await this.estateRepository.findOneBy({ id });
    }

    async create(data: CreateEstateDto): Promise<Estate> {
        const estate = this.estateRepository.create(data);
        return await this.estateRepository.save(estate);
    }

    async update(id: number, data: UpdateEstateDto): Promise<Estate | null> {
        const estate = await this.estateRepository.findOneBy({ id });
        if (!estate) return null;

        Object.assign(estate, data);
        return await this.estateRepository.save(estate);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.estateRepository.delete(id);
        // Исправлено: проверка на null
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
}
