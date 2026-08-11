// estate-service/src/services/estate.service.ts
import { AppDataSource } from '../data-source';
import { Estate } from '../models/Estate.entity';
import { CreateEstateDto, UpdateEstateDto } from '../dto/estate.dto';

export class EstateService {
    private estateRepository = AppDataSource.getRepository(Estate);

    async findAll(): Promise<Estate[]> {
        return this.estateRepository.find();
    }

    async findById(id: number): Promise<Estate | null> {
        return this.estateRepository.findOneBy({ id });
    }

    async create(dto: CreateEstateDto): Promise<Estate> {
        const estate = this.estateRepository.create(dto);
        return this.estateRepository.save(estate);
    }

    async update(id: number, dto: UpdateEstateDto): Promise<Estate | null> {
        const estate = await this.findById(id);
        if (!estate) return null;
        
        Object.assign(estate, dto);
        return this.estateRepository.save(estate);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.estateRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async updateAvailability(id: number, isAvailable: boolean): Promise<Estate | null> {
        const estate = await this.findById(id);
        if (!estate) return null;
        
        estate.is_available = isAvailable;
        return this.estateRepository.save(estate);
    }
}