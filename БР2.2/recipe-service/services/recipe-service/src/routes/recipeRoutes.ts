import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Публичные
router.get('/', optionalAuth, recipeController.list);
router.get('/:id', optionalAuth, recipeController.get);

// Требуют авторизации
router.post('/', requireAuth, recipeController.create);
router.put('/:id', requireAuth, recipeController.update);
router.delete('/:id', requireAuth, recipeController.remove);
router.post('/:id/submit', requireAuth, recipeController.submit);

export default router;
