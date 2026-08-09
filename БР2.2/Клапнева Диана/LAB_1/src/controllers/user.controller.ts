import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get all users
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: List of users
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/User'
     */
    listUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userService.findAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /users/{userId}:
     *   get:
     *     summary: Get user by ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: User found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    getUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);
            const user = await this.userService.findById(userId);

            if (!user) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'User not found' }
                });
                return;
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserRequest'
     *     responses:
     *       201:
     *         description: User created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = plainToInstance(CreateUserDto, req.body);
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

            const user = await this.userService.create(dto);
            res.status(201).json(user);
        } catch (error: any) {
            if (error.code === '23505') {
                res.status(422).json({
                    statusCode: 422,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Email already exists'
                    }
                });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /users/{userId}:
     *   patch:
     *     summary: Update user by ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateUserRequest'
     *     responses:
     *       200:
     *         description: User updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
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
    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);
            const dto = plainToInstance(UpdateUserDto, req.body);
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

            const user = await this.userService.update(userId, dto);

            if (!user) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'User not found' }
                });
                return;
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /users/{userId}:
     *   delete:
     *     summary: Delete user by ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: User deleted
     *       404:
     *         description: User not found
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
    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);
            const deleted = await this.userService.delete(userId);

            if (!deleted) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'User not found' }
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}