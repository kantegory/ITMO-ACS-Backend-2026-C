import {
    Param,
    Body,
    Get,
    Post,
    HttpCode,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Message } from '../models/message.entity';
import { CreateMessageDto, MarkMessagesReadDto } from '../dto/message.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Conversation } from '../models/conversation.entity';

@EntityController({
    baseRoute: '/conversations',
    entity: Message,
})
class MessageController extends BaseController {
    @Get('/:conversationId/messages')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'List messages in conversation', security: [{ bearerAuth: [] }] })
    async getAll(
        @Param('conversationId') conversationId: number,
        @Req() request: RequestWithUser,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 50,
    ) {
        const [data, total] = await this.repository.findAndCount({
            where: { conversationId },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Post('/:conversationId/messages')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Send message', security: [{ bearerAuth: [] }] })
    async create(
        @Param('conversationId') conversationId: number,
        @Req() request: RequestWithUser,
        @Body({ type: CreateMessageDto }) data: CreateMessageDto,
    ) {
        const convRepo = dataSource.getRepository(Conversation);
        const conversation = await convRepo.findOneBy({ id: conversationId }) as Conversation;
        if (!conversation) return { message: 'Conversation not found' };

        const userId = request.user.id;
        if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
            return { message: 'Forbidden: not a participant' };
        }

        const message = this.repository.create({
            conversationId,
            senderId: userId,
            text: data.text,
        });

        const saved = await this.repository.save(message);

        // Update conversation's updatedAt
        conversation.updatedAt = new Date();
        await convRepo.save(conversation);

        return saved;
    }

    @Post('/:conversationId/messages/mark-read')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Mark messages as read', security: [{ bearerAuth: [] }] })
    async markRead(
        @Param('conversationId') conversationId: number,
        @Req() request: RequestWithUser,
        @Body({ type: MarkMessagesReadDto }) data: MarkMessagesReadDto,
    ) {
        await this.repository.update(
            { id: In(data.messageIds), conversationId },
            { isRead: true },
        );

        return { success: true, message: 'Messages marked as read' };
    }
}

export default MessageController;
