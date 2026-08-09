import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { CreateMessageDto, UpdateMessageDto } from '../dto/message.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    /**
     * @swagger
     * /messages:
     *   get:
     *     summary: Get all messages (with optional filters)
     *     tags: [Messages]
     *     parameters:
     *       - in: query
     *         name: session_id
     *         schema:
     *           type: integer
     *         description: Filter by session ID
     *       - in: query
     *         name: user_id
     *         schema:
     *           type: integer
     *         description: Filter by user ID
     *     responses:
     *       200:
     *         description: List of messages
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Message'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    listMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            const session_id = req.query.session_id ? parseInt(req.query.session_id as string) : undefined;
            const user_id = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;

            const messages = await this.messageService.findAll(session_id, user_id);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /messages/{messageId}:
     *   get:
     *     summary: Get message by ID
     *     tags: [Messages]
     *     parameters:
     *       - in: path
     *         name: messageId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Message found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Message'
     *       404:
     *         description: Message not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
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

    /**
     * @swagger
     * /messages:
     *   post:
     *     summary: Create a new message
     *     tags: [Messages]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMessageRequest'
     *     responses:
     *       201:
     *         description: Message created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Message'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: User or Session not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
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
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /messages/{messageId}:
     *   patch:
     *     summary: Update message by ID
     *     tags: [Messages]
     *     parameters:
     *       - in: path
     *         name: messageId
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateMessageRequest'
     *     responses:
     *       200:
     *         description: Message updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Message'
     *       404:
     *         description: Message not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
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

            res.json(message);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /messages/{messageId}:
     *   delete:
     *     summary: Delete message by ID
     *     tags: [Messages]
     *     parameters:
     *       - in: path
     *         name: messageId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Message deleted
     *       404:
     *         description: Message not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Forbidden
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
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

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}