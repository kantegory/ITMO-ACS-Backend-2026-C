import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Публичные маршруты (optionalAuth — чтобы при наличии токена подмешать isLiked/isFavorite)
router.get('/', optionalAuth, recipeController.list);
router.get('/:id', optionalAuth, recipeController.get);

// Маршруты, требующие авторизации
router.post('/', requireAuth, recipeController.create);
router.put('/:id', requireAuth, recipeController.update);
router.delete('/:id', requireAuth, recipeController.remove);
router.post('/:id/submit', requireAuth, recipeController.submit);
router.post('/:id/like', requireAuth, recipeController.like);
router.delete('/:id/like', requireAuth, recipeController.unlike);
router.post('/:id/favorite', requireAuth, recipeController.favorite);
router.delete('/:id/favorite', requireAuth, recipeController.unfavorite);

export default router;
