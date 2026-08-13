import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/session.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class SessionController {
    private sessionService: SessionService;

    constructor() {
        this.sessionService = new SessionService();
    }

    /**
     * @swagger
     * /sessions:
     *   get:
     *     summary: Get all sessions
     *     tags: [Sessions]
     *     responses:
     *       200:
     *         description: List of sessions
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Session'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    listSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessions = await this.sessionService.findAll();
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /sessions/{sessionId}:
     *   get:
     *     summary: Get session by ID
     *     tags: [Sessions]
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Session found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Session'
     *       404:
     *         description: Session not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    getSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = parseInt(req.params.sessionId);
            const session = await this.sessionService.findById(sessionId);

            if (!session) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Session not found' }
                });
                return;
            }

            res.json(session);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /sessions:
     *   post:
     *     summary: Create a new session
     *     tags: [Sessions]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateSessionRequest'
     *     responses:
     *       201:
     *         description: Session created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Session'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = plainToInstance(CreateSessionDto, req.body);
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

            const session = await this.sessionService.create(dto);
            res.status(201).json(session);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /sessions/{sessionId}:
     *   delete:
     *     summary: Delete session by ID
     *     tags: [Sessions]
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Session deleted
     *       404:
     *         description: Session not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    deleteSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = parseInt(req.params.sessionId);
            const deleted = await this.sessionService.delete(sessionId);

            if (!deleted) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Session not found' }
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}