import { Router } from 'express';
import * as interactionController from '../controllers/interactionController';
import { requireAuth } from '../middleware/authMiddleware';

// Gateway направляет сюда только /recipes/:id/like и /recipes/:id/favorite —
// GET /recipes и /recipes/:id обрабатывает Recipe Service
const router = Router();

router.post('/:id/like', requireAuth, interactionController.like);
router.delete('/:id/like', requireAuth, interactionController.unlike);
router.post('/:id/favorite', requireAuth, interactionController.favorite);
router.delete('/:id/favorite', requireAuth, interactionController.unfavorite);

export default router;
