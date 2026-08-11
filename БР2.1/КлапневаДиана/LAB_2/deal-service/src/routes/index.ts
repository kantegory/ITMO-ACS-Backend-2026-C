import { Router } from 'express';
import { DealController } from '../controllers/deal.controller';

const router = Router();
const dealController = new DealController();

// CRUD операции
router.get('/', dealController.getDeals.bind(dealController));
router.post('/', dealController.createDeal.bind(dealController));
router.get('/:id', dealController.getDealById.bind(dealController));
router.put('/:id', dealController.updateDeal.bind(dealController));
router.delete('/:id', dealController.deleteDeal.bind(dealController));

// Специальные запросы
router.get('/status/:status', dealController.getDealsByStatus.bind(dealController));
router.get('/landlord/:landlordId', dealController.getDealsByLandlord.bind(dealController));
router.get('/tenant/:tenantId', dealController.getDealsByTenant.bind(dealController));

export default router;
