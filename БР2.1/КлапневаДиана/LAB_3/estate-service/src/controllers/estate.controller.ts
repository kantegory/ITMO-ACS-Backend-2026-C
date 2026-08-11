import { Request, Response } from 'express';
import { EstateService } from '../services/estate.service';
import { CreateEstateDto, UpdateEstateDto } from '../dto/estate.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventPublisher } from '../rabbitmq/publisher';

export class EstateController {
    private estateService: EstateService;

    constructor() {
        this.estateService = new EstateService();
    }

    listEstates = async (req: Request, res: Response): Promise<void> => {
        try {
            const estates = await this.estateService.findAll();
            res.json(estates);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

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

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'estate.created',
                    {
                        estateId: estate.id,
                        address: estate.address,
                        price: estate.price,
                        userId: estate.user_id,
                        isAvailable: estate.is_available,
                    },
                    'estate-service'
                );
                console.log('Estate created event published for estate:', estate.id);
            } catch (eventError) {
                console.error('Failed to publish estate.created event:', eventError);
            }

            res.status(201).json(estate);
        } catch (error: any) {
            console.error('Error creating estate:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

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

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'estate.updated',
                    {
                        estateId: estate.id,
                        address: estate.address,
                        price: estate.price,
                        isAvailable: estate.is_available,
                    },
                    'estate-service'
                );
                console.log('Estate updated event published for estate:', estate.id);
            } catch (eventError) {
                console.error('Failed to publish estate.updated event:', eventError);
            }

            res.json(estate);
        } catch (error) {
            console.error('Error updating estate:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

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

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'estate.deleted',
                    {
                        estateId: estateId,
                    },
                    'estate-service'
                );
                console.log('Estate deleted event published for estate:', estateId);
            } catch (eventError) {
                console.error('Failed to publish estate.deleted event:', eventError);
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting estate:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updateAvailability = async (req: Request, res: Response): Promise<void> => {
        try {
            const estateId = parseInt(req.params.estateId);
            const { isAvailable } = req.body;

            if (typeof isAvailable !== 'boolean') {
                res.status(422).json({
                    statusCode: 422,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'isAvailable must be a boolean'
                    }
                });
                return;
            }

            const estate = await this.estateService.updateAvailability(estateId, isAvailable);

            if (!estate) {
                res.status(404).json({
                    statusCode: 404,
                    error: { code: 'NOT_FOUND', message: 'Estate not found' }
                });
                return;
            }

            try {
                const publisher = EventPublisher.getInstance();
                await publisher.publishEvent(
                    'estate.availability.changed',
                    {
                        estateId: estate.id,
                        isAvailable: estate.is_available,
                    },
                    'estate-service'
                );
                console.log('Estate availability changed event published for estate:', estate.id);
            } catch (eventError) {
                console.error('Failed to publish estate.availability.changed event:', eventError);
            }

            res.json(estate);
        } catch (error) {
            console.error('Error updating estate availability:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}