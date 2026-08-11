// messaging-service/src/services/message.service.ts
import { AppDataSource } from '../data-source';
import { Message } from '../models/Message.entity';
import { Session } from '../models/Session.entity';
import { CreateMessageDto, UpdateMessageDto } from '../dto/message.dto';

export class MessageService {
    private messageRepository = AppDataSource.getRepository(Message);
    private sessionRepository = AppDataSource.getRepository(Session);

    async findById(id: number): Promise<Message | null> {
        return this.messageRepository.findOneBy({ id });
    }

    async findBySession(sessionId: number): Promise<Message[]> {
        return this.messageRepository.find({
            where: { session_id: sessionId },
            order: { created_at: 'ASC' }
        });
    }

    async create(dto: CreateMessageDto): Promise<Message> {
        const message = this.messageRepository.create(dto);
        return this.messageRepository.save(message);
    }

    async update(id: number, dto: UpdateMessageDto): Promise<Message | null> {
        const message = await this.findById(id);
        if (!message) return null;
        
        Object.assign(message, dto);
        return this.messageRepository.save(message);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.messageRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async createSession(userId: number): Promise<Session> {
        const session = this.sessionRepository.create({ user_id: userId });
        return this.sessionRepository.save(session);
    }
}