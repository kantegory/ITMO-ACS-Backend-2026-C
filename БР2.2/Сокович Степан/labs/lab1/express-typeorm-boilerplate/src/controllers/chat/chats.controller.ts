import { Body, Get, HttpCode, HttpError, Param, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import dataSource from '../../config/data-source';
import { Chat } from '../../models/chat.entity';
import { Message, MessageStatus } from '../../models/message.entity';
import { User } from '../../models/user.entity';
import {
    ChatResponseDto,
    ChatsListResponseDto,
    CreateChatDto,
    CreateMessageDto,
    ErrorResponseDto,
    MessageResponseDto,
    MessagesListResponseDto,
} from './dto';

@EntityController({
    baseRoute: '/chats',
    entity: Chat,
})
class ChatsController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Получить чаты пользователя' })
    @ResponseSchema(ChatsListResponseDto, { statusCode: 200 })
    async getChats(): Promise<ChatsListResponseDto> {
        const chats = await this.repository.find() as Chat[];

        return {
            data: chats.map((chat) => ({
                id: chat.id,
                createdAt: chat.createdAt,
                user1Id: chat.user1Id,
                user2Id: chat.user2Id,
            })),
        };
    }

    @Get('/:id/messages')
    @OpenAPI({ summary: 'Получить сообщения чата' })
    @ResponseSchema(MessagesListResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async getChatMessages(
        @Param('id') id: number,
    ): Promise<MessagesListResponseDto> {
        const chat = await this.repository.findOneBy({ id: String(id) });
        if (!chat) {
            throw new HttpError(404, 'Chat not found');
        }

        const messageRepository = dataSource.getRepository(Message);
        const messages = await messageRepository.find({
            where: { chatId: String(id) },
            order: { createdAt: 'ASC' },
        });

        return {
            data: messages.map((message) => ({
                id: message.id,
                createdAt: message.createdAt,
                text: message.text,
                sentBy: message.sentBy,
                status: message.status,
                edited: message.edited,
                chatId: message.chatId,
            })),
        };
    }

    @Post('/:id/messages')
    @HttpCode(201)
    @OpenAPI({ summary: 'Отправить сообщение в чат' })
    @ResponseSchema(MessageResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async createChatMessage(
        @Param('id') id: number,
        @Body({ type: CreateMessageDto }) body: CreateMessageDto,
    ): Promise<MessageResponseDto> {
        const chat = await this.repository.findOneBy({ id: String(id) });
        if (!chat) {
            throw new HttpError(404, 'Chat not found');
        }

        const userRepository = dataSource.getRepository(User);
        const sender = await userRepository.findOneBy({ id: String(body.sentBy) });
        if (!sender) {
            throw new HttpError(400, 'sentBy is invalid');
        }

        const senderId = String(body.sentBy);
        if (senderId !== chat.user1Id && senderId !== chat.user2Id) {
            throw new HttpError(400, 'Sender is not a member of this chat');
        }

        const messageRepository = dataSource.getRepository(Message);
        const message = messageRepository.create({
            text: body.text,
            sentBy: senderId,
            chatId: chat.id,
            status: MessageStatus.SENT,
            edited: false,
        });

        const savedMessage = await messageRepository.save(message);

        return {
            id: savedMessage.id,
            createdAt: savedMessage.createdAt,
            text: savedMessage.text,
            sentBy: savedMessage.sentBy,
            status: savedMessage.status,
            edited: savedMessage.edited,
            chatId: savedMessage.chatId,
        };
    }

    @Post('/')
    @HttpCode(201)
    @OpenAPI({ summary: 'Создать чат между пользователями' })
    @ResponseSchema(ChatResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async createChat(
        @Body({ type: CreateChatDto }) body: CreateChatDto,
    ): Promise<ChatResponseDto> {
        const { user1Id, user2Id } = body;

        if (user1Id === user2Id) {
            throw new HttpError(400, 'user1Id and user2Id must be different');
        }

        const userRepository = dataSource.getRepository(User);
        const [user1, user2] = await Promise.all([
            userRepository.findOneBy({ id: String(user1Id) }),
            userRepository.findOneBy({ id: String(user2Id) }),
        ]);

        if (!user1 || !user2) {
            throw new HttpError(400, 'user1Id or user2Id is invalid');
        }

        const existingChat = await this.repository
            .createQueryBuilder('chat')
            .where(
                '(chat.user_1_id = :user1Id AND chat.user_2_id = :user2Id) OR (chat.user_1_id = :user2Id AND chat.user_2_id = :user1Id)',
                { user1Id: String(user1Id), user2Id: String(user2Id) },
            )
            .getOne();

        if (existingChat) {
            throw new HttpError(400, 'Chat already exists for these users');
        }

        const chat = this.repository.create({
            user1Id: String(user1Id),
            user2Id: String(user2Id),
        });

        const savedChat = await this.repository.save(chat) as Chat;

        return {
            id: savedChat.id,
            createdAt: savedChat.createdAt,
            user1Id: savedChat.user1Id,
            user2Id: savedChat.user2Id,
        };
    }
}

export default ChatsController;
