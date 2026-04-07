import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    QueryParams,
    Req,
    UseBefore,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { Message } from '../models/message.entity';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

import {
    SendMessageRequest,
    MarkAsReadRequest,
    MyMessagesQueryDto,
    MessagesListQueryDto,
    ConversationQueryDto,
} from '../dto/message';

@EntityController({ baseRoute: '/messages', entity: Message })
@UseBefore(authMiddleware)
@OpenAPI({ tags: ['Messages'], security: [{ bearerAuth: [] }] })
export default class MessagesController extends BaseController {
    @Get('/me')
    @OpenAPI({ summary: 'Get my messages', tags: ['Messages'] })
    async myMessages(
        @Req() req: RequestWithUser,
        @QueryParams() query: MyMessagesQueryDto,
    ) {
        const qb = this.repository
            .createQueryBuilder('msg')
            .leftJoinAndSelect('msg.sender', 'sender')
            .leftJoinAndSelect('msg.receiver', 'receiver')
            .where('(msg.sender_id = :userId OR msg.receiver_id = :userId)', {
                userId: req.user.id,
            });

        if (query.search) {
            qb.andWhere('msg.mes_text ILIKE :search', {
                search: `%${query.search}%`,
            });
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }

    @Get('/')
    @OpenAPI({ summary: 'List user messages', tags: ['Messages'] })
    async list(
        @Req() req: RequestWithUser,
        @QueryParams() query: MessagesListQueryDto,
    ) {
        const { page = 1, limit = 10, sort = 'created_at' } = query;

        const [items, total] = await this.repository.findAndCount({
            where: [{ sender_id: req.user.id }, { receiver_id: req.user.id }],
            take: limit,
            skip: (page - 1) * limit,
            order: { [sort]: 'DESC' },
            relations: ['sender', 'receiver'],
        });

        return { items, total, page, limit };
    }

    @Post('/')
    @OpenAPI({ summary: 'Send new message', tags: ['Messages'] })
    async create(
        @Req() req: RequestWithUser,
        @Body() body: SendMessageRequest,
    ) {
        const message = this.repository.create({
            sender_id: req.user.id,
            receiver_id: body.receiver_id,
            accom_id: body.accom_id,
            mes_text: body.mes_text,
            mes_type: body.mes_type ?? 'text',
            is_read: false,
        });

        const savedMessage = await this.repository.save(message);

        return {
            message: savedMessage,
            sender: {
                first_name: req.user.first_name,
                last_name: req.user.last_name,
            },
            receiver: { id: body.receiver_id },
            attachments: body.attachment_ids ?? [],
        };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get message by ID', tags: ['Messages'] })
    async read(@Req() req: RequestWithUser, @Param('id') id: number) {
        const message = await this.repository.findOne({
            where: { id },
            relations: ['sender', 'receiver'],
        });

        if (!message) throw new NotFoundError('Message not found');
        if (
            message.sender_id !== req.user.id &&
            message.receiver_id !== req.user.id
        ) {
            throw new UnauthorizedError('Access denied');
        }

        return {
            message,
            sender: {
                first_name: message.sender?.first_name || 'Sender',
                last_name: message.sender?.last_name || 'User',
            },
            receiver: {
                first_name: message.receiver?.first_name || 'Receiver',
                last_name: message.receiver?.last_name || 'User',
            },
            attachments: [],
        };
    }

    @Patch('/:id')
    @OpenAPI({ summary: 'Mark message as read', tags: ['Messages'] })
    async markAsRead(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() body: MarkAsReadRequest,
    ) {
        const message = await this.repository.findOne({
            where: { id },
            relations: ['sender', 'receiver'],
        });

        if (!message) throw new NotFoundError('Message not found');
        if (message.receiver_id !== req.user.id) {
            throw new UnauthorizedError('Access denied');
        }

        message.is_read = body.is_read;
        const updatedMessage = await this.repository.save(message);

        return {
            message: updatedMessage,
            sender: {
                first_name: message.sender?.first_name || 'Sender',
                last_name: message.sender?.last_name || 'User',
            },
            receiver: {
                first_name: message.receiver?.first_name || 'Receiver',
                last_name: message.receiver?.last_name || 'User',
            },
            attachments: [],
        };
    }

    @Delete('/:id')
    @OpenAPI({ summary: 'Delete message', tags: ['Messages'] })
    async delete(@Req() req: RequestWithUser, @Param('id') id: number) {
        const message = await this.repository.findOneBy({ id });
        if (!message) throw new NotFoundError('Message not found');

        if (
            message.sender_id !== req.user.id &&
            message.receiver_id !== req.user.id
        ) {
            throw new UnauthorizedError('Access denied');
        }

        await this.repository.remove(message);
        return null;
    }

    @Get('/conversation')
    @OpenAPI({ summary: 'Get conversation messages', tags: ['Messages'] })
    async getConversation(
        @Req() req: RequestWithUser,
        @QueryParams() query: ConversationQueryDto,
    ) {
        if (req.user.id !== query.user_id) {
            throw new UnauthorizedError('Access denied');
        }

        const [items, total] = await this.repository.findAndCount({
            where: [
                {
                    sender_id: query.user_id,
                    receiver_id: req.user.id,
                    accom_id: query.accom_id,
                },
                {
                    sender_id: req.user.id,
                    receiver_id: query.user_id,
                    accom_id: query.accom_id,
                },
            ],
            take: query.limit,
            skip: (query.page - 1) * query.limit,
            order: { created_at: 'DESC' },
            relations: ['sender', 'receiver'],
        });

        const formattedItems = items.map((msg) => ({
            message: msg,
            sender: {
                first_name: msg.sender?.first_name || 'Sender',
                last_name: msg.sender?.last_name || 'User',
            },
            receiver: {
                first_name: msg.receiver?.first_name || 'Receiver',
                last_name: msg.receiver?.last_name || 'User',
            },
            attachments: [],
        }));

        return {
            items: formattedItems,
            total,
            page: query.page,
            limit: query.limit,
        };
    }
}
