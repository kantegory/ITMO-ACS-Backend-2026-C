import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsInt,
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';
import { Message } from '../models/message.entity';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

const VALID_MESSAGE_TYPES = ['text', 'image', 'file'];

export class SendMessageRequest {
    @IsInt() @Type(() => Number) receiver_id: number;
    @IsInt() @Type(() => Number) accom_id: number;
    @IsString() mes_text: string;
    @IsOptional() @IsEnum(VALID_MESSAGE_TYPES) mes_type?: string;
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => Number)
    attachment_ids?: number[];
}

export class MarkAsReadRequest {
    @IsBoolean() @Type(() => Boolean) is_read: boolean;
}

@EntityController({ baseRoute: '/messages', entity: Message })
@UseBefore(authMiddleware)
@OpenAPI({ tags: ['Messages'], security: [{ bearerAuth: [] }] })
export default class MessagesController extends BaseController {
    @Get('/me')
    @OpenAPI({ summary: 'Get my messages', tags: ['Messages'] })
    async myMessages(
        @Req() req: RequestWithUser,
        @QueryParam('search') search?: string,
    ) {
        const qb = this.repository
            .createQueryBuilder('msg')
            .leftJoinAndSelect('msg.sender', 'sender')
            .leftJoinAndSelect('msg.receiver', 'receiver')
            .where('(msg.sender_id = :userId OR msg.receiver_id = :userId)', {
                userId: req.user.id,
            });

        if (search) {
            qb.andWhere('msg.mes_text ILIKE :search', {
                search: `%${search}%`,
            });
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }

    @Get('/')
    @OpenAPI({ summary: 'List user messages', tags: ['Messages'] })
    async list(
        @Req() req: RequestWithUser,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 10,
        @QueryParam('sort') sort: string = 'created_at',
    ) {
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
            mes_type: body.mes_type || 'text',
            is_read: false,
            is_delivered: false,
        });

        const savedMessage = await this.repository.save(message);
        return {
            message: savedMessage,
            sender: {
                first_name: req.user.first_name,
                last_name: req.user.last_name,
            },
            receiver: { id: body.receiver_id },
            attachments: body.attachment_ids || [],
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
        @QueryParam('accom_id') accomId: number,
        @QueryParam('user_id') userId: number,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 10,
    ) {
        if (req.user.id !== userId) {
            throw new UnauthorizedError('Access denied');
        }

        const [items, total] = await this.repository.findAndCount({
            where: [
                {
                    sender_id: userId,
                    receiver_id: req.user.id,
                    accom_id: accomId,
                },
                {
                    sender_id: req.user.id,
                    receiver_id: userId,
                    accom_id: accomId,
                },
            ],
            take: limit,
            skip: (page - 1) * limit,
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

        return { items: formattedItems, total, page, limit };
    }
}
