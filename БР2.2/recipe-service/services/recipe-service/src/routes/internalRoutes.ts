import { Router } from 'express';
import * as internalController from '../controllers/internalController';
import { requireInternalKey } from '../middleware/internalAuthMiddleware';

const router = Router();
router.use(requireInternalKey);

router.get('/recipes', internalController.getRecipes);
router.get('/recipes/:id', internalController.getRecipe);

export default router;
