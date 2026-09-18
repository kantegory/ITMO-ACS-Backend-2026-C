import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';
import { requireAuth } from '../middleware/authMiddleware';

// Внимание: Gateway направляет сюда только GET /users/me/recipes —
// GET /users/me и /users/me/favorites обрабатывают другие сервисы
const router = Router();
router.get('/recipes', requireAuth, recipeController.myRecipes);

export default router;
