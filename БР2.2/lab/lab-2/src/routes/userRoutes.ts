import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', requireAuth, userController.me);
router.put('/me', requireAuth, userController.updateMe);
router.get('/me/recipes', requireAuth, userController.myRecipes);
router.get('/me/favorites', requireAuth, userController.myFavorites);

export default router;
