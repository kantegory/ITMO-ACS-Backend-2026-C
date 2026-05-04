import { Router } from 'express';
import rentController from '../controllers/rent.controller';
import { authMiddleware } from '../middleware';

const router = Router();

router.get('/', authMiddleware, rentController.getAll);
router.get('/:id', authMiddleware, rentController.getById);
router.get('/batch', authMiddleware, rentController.getBatch);
router.post('/', authMiddleware, rentController.create);

router.get('/accommodation/:accomId/active', authMiddleware, rentController.getActiveByAccommodation);
router.get('/find/me', authMiddleware, rentController.getMyTenant);

router.get('/accommodation/:accommodationId', authMiddleware, rentController.getByAccommodation);

export default router;