import {
    Body,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { Chat } from '../models/chat.entity';
import { CreateChatDto, CreateMessageDto } from '../dto/chat.dto';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { Message } from '../models/message.entity';
import { MessageStatus } from '../models/enums';

@EntityController({
    baseRoute: '/chats',
    entity: Chat,
})
class ChatController extends BaseController {
    @Get('')
    @UseBefore(authMiddleware)
    async list(@Req() request: RequestWithUser) {
        const data = await this.repository
            .createQueryBuilder('chat')
            .where('chat.user_1_id = :userId', { userId: request.user.id })
            .orWhere('chat.user_2_id = :userId', { userId: request.user.id })
            .orderBy('chat.id', 'DESC')
            .getMany();

        return { data };
    }

    @Post('')
    @UseBefore(authMiddleware)
    async create(
        @Body({ type: CreateChatDto }) payload: CreateChatDto,
        @Req() request: RequestWithUser,
    ) {
        if (request.user.id !== payload.user1Id && request.user.id !== payload.user2Id) {
            throw new ForbiddenError('You must be chat participant');
        }

        const userRepository = dataSource.getRepository(User);
        const [u1, u2] = await Promise.all([
            userRepository.findOneBy({ id: payload.user1Id }),
            userRepository.findOneBy({ id: payload.user2Id }),
        ]);
        if (!u1 || !u2) {
            throw new NotFoundError('User is not found');
        }

        const existing = await this.repository
            .createQueryBuilder('chat')
            .where(
                '(chat.user_1_id = :u1 AND chat.user_2_id = :u2) OR (chat.user_1_id = :u2 AND chat.user_2_id = :u1)',
                { u1: payload.user1Id, u2: payload.user2Id },
            )
            .getOne();

        if (existing) {
            return existing;
        }

        const chat = this.repository.create(payload);
        return await this.repository.save(chat);
    }

    @Get('/:id/messages')
    @UseBefore(authMiddleware)
    async listMessages(@Param('id') id: number, @Req() request: RequestWithUser) {
        const chat = (await this.repository.findOneBy({ id })) as Chat | null;
        if (!chat) {
            throw new NotFoundError('Chat is not found');
        }

        this.assertParticipant(chat, request.user.id);

        const messageRepository = dataSource.getRepository(Message);
        const data = await messageRepository.find({
            where: { chatId: id },
            order: { id: 'ASC' },
        });

        return { data };
    }

    @Post('/:id/messages')
    @UseBefore(authMiddleware)
    async createMessage(
        @Param('id') id: number,
        @Body({ type: CreateMessageDto }) payload: CreateMessageDto,
        @Req() request: RequestWithUser,
    ) {
        const chat = (await this.repository.findOneBy({ id })) as Chat | null;
        if (!chat) {
            throw new NotFoundError('Chat is not found');
        }

        this.assertParticipant(chat, request.user.id);

        if (payload.sentBy !== request.user.id) {
            throw new ForbiddenError('sentBy must match authenticated user');
        }

        const messageRepository = dataSource.getRepository(Message);
        const message = messageRepository.create({
            chatId: id,
            sentBy: payload.sentBy,
            text: payload.text,
            status: MessageStatus.SENT,
            edited: false,
        });

        return await messageRepository.save(message);
    }

    private assertParticipant(chat: Chat, userId: number): void {
        if (chat.user1Id !== userId && chat.user2Id !== userId) {
            throw new ForbiddenError('You are not chat participant');
        }
    }
}

export default ChatController;
