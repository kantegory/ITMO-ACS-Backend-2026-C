import { Request, Response } from 'express';
import { DealService } from '../services/deal.service';
import { CreateDealDto, UpdateDealDto } from '../dto/deal.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class DealController {
    private dealService: DealService;

    constructor() {
        this.dealService = new DealService();
    }

    /**
     * @swagger
     * /deals:
     *   get:
     *     summary: Get all deals
     *     tags: [Deals]
     *     responses:
     *       200:
     *         description: List of deals
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Deal'
     *       422:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    listDeals = async (req: Request, res: Response): Promise<void> => {
        try {
            const deals = await this.dealService.findAll();
            res.json(deals);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /deals/{dealId}:
     *   get:
     *     summary: Get deal by ID
     *     tags: [Deals]
     *     parameters:
     *       - in: path
     *         name: dealId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Deal found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Deal'
     *       404:
     *         description: Deal not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    getDeal = async (req: Request, res: Response): Promise<void> => {
        try {
            const dealId = parseInt(req.params.dealId);
            const deal = await this.dealService.findById(dealId);

            if (!deal) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Deal not found' }
                });
                return;
            }

            res.json(deal);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /deals:
     *   post:
     *     summary: Create a new deal
     *     tags: [Deals]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateDealRequest'
     *     responses:
     *       201:
     *         description: Deal created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Deal'
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
    createDeal = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = plainToInstance(CreateDealDto, req.body);
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

            const deal = await this.dealService.create(dto);
            res.status(201).json(deal);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /deals/{dealId}:
     *   patch:
     *     summary: Update deal by ID
     *     tags: [Deals]
     *     parameters:
     *       - in: path
     *         name: dealId
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateDealRequest'
     *     responses:
     *       200:
     *         description: Deal updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Deal'
     *       404:
     *         description: Deal not found
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
    updateDeal = async (req: Request, res: Response): Promise<void> => {
        try {
            const dealId = parseInt(req.params.dealId);
            const dto = plainToInstance(UpdateDealDto, req.body);
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

            const deal = await this.dealService.update(dealId, dto);

            if (!deal) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Deal not found' }
                });
                return;
            }

            res.json(deal);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    /**
     * @swagger
     * /deals/{dealId}:
     *   delete:
     *     summary: Delete deal by ID
     *     tags: [Deals]
     *     parameters:
     *       - in: path
     *         name: dealId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Deal deleted
     *       404:
     *         description: Deal not found
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
    deleteDeal = async (req: Request, res: Response): Promise<void> => {
        try {
            const dealId = parseInt(req.params.dealId);
            const deleted = await this.dealService.delete(dealId);

            if (!deleted) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Deal not found' }
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}