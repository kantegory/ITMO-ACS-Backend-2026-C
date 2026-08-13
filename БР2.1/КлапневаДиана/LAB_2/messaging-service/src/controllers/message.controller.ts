// messaging-service/src/controllers/message.controller.ts
import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { CreateMessageDto, UpdateMessageDto } from '../dto/message.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventPublisher } from '../rabbitmq/publisher';

export class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    listMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = parseInt(req.params.sessionId);
            const messages = await this.messageService.findBySession(sessionId);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const messageId = parseInt(req.params.messageId);
            const message = await this.messageService.findById(messageId);

            if (!message) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Message not found' }
                });
                return;
            }

            res.json(message);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    createMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = plainToInstance(CreateMessageDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(422).json({
                    statusCode: 422,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: errors.map(e => ({
                            field: e.property,
                            message: Object.values(e.constraints || {})[0]
                        }))
                    }
                });
                return;
            }

            const message = await this.messageService.create(dto);

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'message.sent',
                    {
                        messageId: message.id,
                        sessionId: message.session_id,
                        userId: message.user_id,
                        message: message.message,
                    },
                    'messaging-service'
                );
                console.log('Message sent event published for message:', message.id);
            } catch (eventError) {
                console.error('Failed to publish message.sent event:', eventError);
            }

            res.status(201).json(message);
        } catch (error: any) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updateMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const messageId = parseInt(req.params.messageId);
            const dto = plainToInstance(UpdateMessageDto, req.body);
            const errors = await validate(dto, { skipMissingProperties: true });

            if (errors.length > 0) {
                res.status(422).json({
                    statusCode: 422,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: errors.map(e => ({
                            field: e.property,
                            message: Object.values(e.constraints || {})[0]
                        }))
                    }
                });
                return;
            }

            const message = await this.messageService.update(messageId, dto);

            if (!message) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Message not found' }
                });
                return;
            }

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'message.updated',
                    {
                        messageId: message.id,
                        message: message.message,
                    },
                    'messaging-service'
                );
                console.log('Message updated event published for message:', message.id);
            } catch (eventError) {
                console.error('Failed to publish message.updated event:', eventError);
            }

            res.json(message);
        } catch (error) {
            console.error('Error updating message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    deleteMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const messageId = parseInt(req.params.messageId);
            const deleted = await this.messageService.delete(messageId);

            if (!deleted) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Message not found' }
                });
                return;
            }

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'message.deleted',
                    {
                        messageId: messageId,
                    },
                    'messaging-service'
                );
                console.log('Message deleted event published for message:', messageId);
            } catch (eventError) {
                console.error('Failed to publish message.deleted event:', eventError);
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.body;

            if (!userId) {
                res.status(422).json({
                    statusCode: 422,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'userId is required'
                    }
                });
                return;
            }

            const session = await this.messageService.createSession(userId);

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'session.created',
                    {
                        sessionId: session.id,
                        userId: session.user_id,
                    },
                    'messaging-service'
                );
                console.log('Session created event published for session:', session.id);
            } catch (eventError) {
                console.error('Failed to publish session.created event:', eventError);
            }

            res.status(201).json(session);
        } catch (error: any) {
            console.error('Error creating session:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}