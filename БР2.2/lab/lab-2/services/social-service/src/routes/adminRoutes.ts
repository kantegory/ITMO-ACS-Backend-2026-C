import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth, requireAdmin);
router.delete('/comments/:id', adminController.deleteComment);

export default router;
