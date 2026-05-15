import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authMiddleware } from "../middleware";

const router = Router();

router.get('/batch',  authMiddleware ,paymentController.batch);
router.get('/:id', authMiddleware, paymentController.getById);
router.post('/', authMiddleware, paymentController.create);
router.get('/rent/:rentId',  authMiddleware, paymentController.getByRent);
router.post('/:id/process', authMiddleware, paymentController.process);

export default router;
