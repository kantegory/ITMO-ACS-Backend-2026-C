import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Session } from '../models/Session.entity';
import { CreateSessionDto } from '../dto/session.dto';

export class SessionService {
    private sessionRepository: Repository<Session>;

    constructor() {
        this.sessionRepository = AppDataSource.getRepository(Session);
    }

    async findAll(): Promise<Session[]> {
        return await this.sessionRepository.find();
    }

    async findById(id: number): Promise<Session | null> {
        return await this.sessionRepository.findOneBy({ id });
    }

    async create(data: CreateSessionDto): Promise<Session> {
        const session = this.sessionRepository.create(data);
        return await this.sessionRepository.save(session);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.sessionRepository.delete(id);
        // Исправлено: проверка на null
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
}
