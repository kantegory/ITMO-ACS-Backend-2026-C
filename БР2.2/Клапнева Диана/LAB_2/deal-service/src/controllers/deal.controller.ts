import { Request, Response } from 'express';
import { DealService } from '../services/deal.service';
import { CreateDealDto, UpdateDealDto } from '../dto/deal.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const dealService = new DealService();

export class DealController {
    // Создание сделки
    async createDeal(req: Request, res: Response) {
        try {
            const createDealDto = plainToInstance(CreateDealDto, req.body);
            const errors = await validate(createDealDto);

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            const deal = await dealService.create(createDealDto);
            res.status(201).json(deal);
        } catch (error) {
            console.error('Error creating deal:', error);
            res.status(500).json({ error: 'Failed to create deal' });
        }
    }

    // Получение всех сделок
    async getDeals(req: Request, res: Response) {
        try {
            const { status, landlord_id, tenant_id, is_published } = req.query;

            const filters: any = {};
            if (status) filters.status = status as string;
            if (landlord_id) filters.landlordId = parseInt(landlord_id as string);
            if (tenant_id) filters.tenantId = parseInt(tenant_id as string);
            if (is_published !== undefined) filters.isPublished = is_published === 'true';

            const deals = await dealService.findWithFilters(filters);
            res.json(deals);
        } catch (error) {
            console.error('Error getting deals:', error);
            res.status(500).json({ error: 'Failed to get deals' });
        }
    }

    // Получение сделки по ID
    async getDealById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const deal = await dealService.findOne(id);

            if (!deal) {
                return res.status(404).json({ error: 'Deal not found' });
            }

            res.json(deal);
        } catch (error) {
            console.error('Error getting deal:', error);
            res.status(500).json({ error: 'Failed to get deal' });
        }
    }

    // Обновление сделки
    async updateDeal(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const updateDealDto = plainToInstance(UpdateDealDto, req.body);
            const errors = await validate(updateDealDto);

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            const deal = await dealService.update(id, updateDealDto);

            if (!deal) {
                return res.status(404).json({ error: 'Deal not found' });
            }

            res.json(deal);
        } catch (error) {
            console.error('Error updating deal:', error);
            res.status(500).json({ error: 'Failed to update deal' });
        }
    }

    // Удаление сделки
    async deleteDeal(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const deal = await dealService.findOne(id);

            if (!deal) {
                return res.status(404).json({ error: 'Deal not found' });
            }

            await dealService.remove(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting deal:', error);
            res.status(500).json({ error: 'Failed to delete deal' });
        }
    }

    // Получение сделок по статусу
    async getDealsByStatus(req: Request, res: Response) {
        try {
            const status = req.params.status;
            const deals = await dealService.findByStatus(status);
            res.json(deals);
        } catch (error) {
            console.error('Error getting deals by status:', error);
            res.status(500).json({ error: 'Failed to get deals by status' });
        }
    }

    // Получение сделок арендодателя
    async getDealsByLandlord(req: Request, res: Response) {
        try {
            const landlordId = parseInt(req.params.landlordId);
            const deals = await dealService.findByLandlord(landlordId);
            res.json(deals);
        } catch (error) {
            console.error('Error getting deals by landlord:', error);
            res.status(500).json({ error: 'Failed to get deals by landlord' });
        }
    }

    // Получение сделок арендатора
    async getDealsByTenant(req: Request, res: Response) {
        try {
            const tenantId = parseInt(req.params.tenantId);
            const deals = await dealService.findByTenant(tenantId);
            res.json(deals);
        } catch (error) {
            console.error('Error getting deals by tenant:', error);
            res.status(500).json({ error: 'Failed to get deals by tenant' });
        }
    }
}
