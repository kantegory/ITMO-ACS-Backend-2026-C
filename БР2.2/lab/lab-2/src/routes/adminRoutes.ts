import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.put('/recipes/:id/approve', adminController.approveRecipe);
router.put('/recipes/:id/reject', adminController.rejectRecipe);
router.delete('/recipes/:id', adminController.deleteRecipe);
router.delete('/comments/:id', adminController.deleteComment);

export default router;
