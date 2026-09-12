import { Router } from 'express';
import * as internalController from '../controllers/internalController';
import { requireInternalKey } from '../middleware/internalAuthMiddleware';

const router = Router();
router.use(requireInternalKey);

router.get('/likes/count/:recipeId', internalController.getLikesCount);
router.get('/likes/counts', internalController.getLikesCounts);
router.get('/interactions', internalController.getInteractions);
router.delete('/recipes/:recipeId/interactions', internalController.deleteInteractions);

export default router;
