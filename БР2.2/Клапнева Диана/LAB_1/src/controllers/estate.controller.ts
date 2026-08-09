import { Request, Response } from 'express';
import { EstateService } from '../services/estate.service';
import { CreateEstateDto, UpdateEstateDto } from '../dto/estate.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class EstateController {
    private estateService: EstateService;

    constructor() {
        this.estateService = new EstateService();
    }

    /**
     * @swagger
     * /estates:
     *   get:
     *     summary: Get all estates
     *     tags: [Estates]
     *     responses:
     *       200:
     *         description: List of estates
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Estate'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    listEstates = async (req: Request, res: Response): Promise<void> => {
        try {
            const estates = await this.estateService.findAll();
            res.json(estates);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /estates/{estateId}:
     *   get:
     *     summary: Get estate by ID
     *     tags: [Estates]
     *     parameters:
     *       - in: path
     *         name: estateId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Estate found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Estate'
     *       404:
     *         description: Estate not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    getEstate = async (req: Request, res: Response): Promise<void> => {
        try {
            const estateId = parseInt(req.params.estateId);
            const estate = await this.estateService.findById(estateId);

            if (!estate) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Estate not found' }
                });
                return;
            }

            res.json(estate);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /estates:
     *   post:
     *     summary: Create a new estate
     *     tags: [Estates]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateEstateRequest'
     *     responses:
     *       201:
     *         description: Estate created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Estate'
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
    createEstate = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = plainToInstance(CreateEstateDto, req.body);
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

            const estate = await this.estateService.create(dto);
            res.status(201).json(estate);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /estates/{estateId}:
     *   patch:
     *     summary: Update estate by ID
     *     tags: [Estates]
     *     parameters:
     *       - in: path
     *         name: estateId
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateEstateRequest'
     *     responses:
     *       200:
     *         description: Estate updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Estate'
     *       404:
     *         description: Estate not found
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
    updateEstate = async (req: Request, res: Response): Promise<void> => {
        try {
            const estateId = parseInt(req.params.estateId);
            const dto = plainToInstance(UpdateEstateDto, req.body);
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

            const estate = await this.estateService.update(estateId, dto);

            if (!estate) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Estate not found' }
                });
                return;
            }

            res.json(estate);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /estates/{estateId}:
     *   delete:
     *     summary: Delete estate by ID
     *     tags: [Estates]
     *     parameters:
     *       - in: path
     *         name: estateId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Estate deleted
     *       404:
     *         description: Estate not found
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
    deleteEstate = async (req: Request, res: Response): Promise<void> => {
        try {
            const estateId = parseInt(req.params.estateId);
            const deleted = await this.estateService.delete(estateId);

            if (!deleted) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Estate not found' }
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}