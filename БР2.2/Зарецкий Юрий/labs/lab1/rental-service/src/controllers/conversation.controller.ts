import {
    Param,
    Body,
    Get,
    Post,
    Delete,
    HttpCode,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Conversation } from '../models/conversation.entity';
import { CreateConversationDto } from '../dto/conversation.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Message } from '../models/message.entity';

@EntityController({
    baseRoute: '/conversations',
    entity: Conversation,
})
class ConversationController extends BaseController {
    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'My conversations', security: [{ bearerAuth: [] }] })
    async getAll(
        @Req() request: RequestWithUser,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const userId = request.user.id;

        const [data, total] = await this.repository
            .createQueryBuilder('conv')
            .leftJoinAndSelect('conv.user1', 'user1')
            .leftJoinAndSelect('conv.user2', 'user2')
            .leftJoinAndSelect('conv.property', 'property')
            .where('conv.user1Id = :userId OR conv.user2Id = :userId', { userId })
            .orderBy('conv.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/unread-count')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Total unread message count', security: [{ bearerAuth: [] }] })
    async unreadCount(@Req() request: RequestWithUser) {
        const userId = request.user.id;
        const messageRepo = dataSource.getRepository(Message);

        const count = await messageRepo
            .createQueryBuilder('msg')
            .innerJoin('msg.conversation', 'conv')
            .where('(conv.user1Id = :userId OR conv.user2Id = :userId)', { userId })
            .andWhere('msg.senderId != :userId', { userId })
            .andWhere('msg.isRead = :isRead', { isRead: false })
            .getCount();

        return { unreadCount: count };
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create or get existing conversation', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateConversationDto }) data: CreateConversationDto,
    ) {
        const currentUserId = request.user.id;
        const otherUserId = data.userId;
        const propertyId = data.propertyId;

        if (currentUserId === otherUserId) {
            return { message: 'Cannot create conversation with yourself' };
        }

        // Check if conversation already exists
        const existing = await this.repository
            .createQueryBuilder('conv')
            .where('conv.propertyId = :propertyId', { propertyId })
            .andWhere(
                '((conv.user1Id = :uid1 AND conv.user2Id = :uid2) OR (conv.user1Id = :uid2 AND conv.user2Id = :uid1))',
                { uid1: currentUserId, uid2: otherUserId },
            )
            .getOne();

        if (existing) {
            // Add the initial message to existing conversation
            const messageRepo = dataSource.getRepository(Message);
            const msg = messageRepo.create({
                conversationId: (existing as Conversation).id,
                senderId: currentUserId,
                text: data.message,
            });
            await messageRepo.save(msg);
            return existing;
        }

        const conversation = this.repository.create({
            user1Id: currentUserId,
            user2Id: otherUserId,
            propertyId,
        });
        const saved = await this.repository.save(conversation);

        // Create the first message
        const messageRepo = dataSource.getRepository(Message);
        const msg = messageRepo.create({
            conversationId: (saved as Conversation).id,
            senderId: currentUserId,
            text: data.message,
        });
        await messageRepo.save(msg);

        return saved;
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get conversation', security: [{ bearerAuth: [] }] })
    async getById(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const conversation = await this.repository.findOne({
            where: { id },
            relations: ['user1', 'user2', 'property'],
        });
        if (!conversation) return { message: 'Conversation not found' };
        return conversation;
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete conversation', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const conversation = await this.repository.findOneBy({ id }) as Conversation;
        if (!conversation) return { message: 'Conversation not found' };

        const userId = request.user.id;
        if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
            return { message: 'Forbidden: not a participant' };
        }

        await this.repository.remove(conversation);
        return '';
    }
}

export default ConversationController;
