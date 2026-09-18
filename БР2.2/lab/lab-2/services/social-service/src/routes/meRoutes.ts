import { Router } from 'express';
import * as interactionController from '../controllers/interactionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.get('/favorites', requireAuth, interactionController.myFavorites);

export default router;
