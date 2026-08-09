import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Message } from '../models/Message.entity';
import { CreateMessageDto, UpdateMessageDto } from '../dto/message.dto';

export class MessageService {
    private messageRepository: Repository<Message>;

    constructor() {
        this.messageRepository = AppDataSource.getRepository(Message);
    }

    async findAll(session_id?: number, user_id?: number): Promise<Message[]> {
        const where: any = {};
        if (session_id) where.session_id = session_id;
        if (user_id) where.user_id = user_id;
        return await this.messageRepository.find({ where });
    }

    async findById(id: number): Promise<Message | null> {
        return await this.messageRepository.findOneBy({ id });
    }

    async create(data: CreateMessageDto): Promise<Message> {
        const message = this.messageRepository.create(data);
        return await this.messageRepository.save(message);
    }

    async update(id: number, data: UpdateMessageDto): Promise<Message | null> {
        const message = await this.messageRepository.findOneBy({ id });
        if (!message) return null;

        Object.assign(message, data);
        return await this.messageRepository.save(message);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.messageRepository.delete(id);
        // Исправлено: проверка на null
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
}
