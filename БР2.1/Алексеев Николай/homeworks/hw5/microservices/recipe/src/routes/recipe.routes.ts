import { Router } from 'express';
import { param, body, query } from 'express-validator';
import { RecipeController } from '../controllers/recipe.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const recipeController = new RecipeController();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString(),
    query('typeId').optional().isInt().toInt(),
    query('cuisineId').optional().isInt().toInt(),
  ],
  recipeController.list
);

router.get('/search', recipeController.search);

router.get('/:id', [param('id').isInt().toInt()], recipeController.getById);

router.post('/', authMiddleware, recipeController.create);
router.patch('/:id', authMiddleware, [param('id').isInt().toInt()], recipeController.update);
router.delete('/:id', authMiddleware, [param('id').isInt().toInt()], recipeController.delete);
router.post('/:id/publish', authMiddleware, [param('id').isInt().toInt()], recipeController.publish);

router.get('/user/me', authMiddleware, recipeController.getUserRecipes);
router.get('/user/:userId', recipeController.getUserRecipes);

router.get('/internal/recipes/:id', recipeController.getRecipeInternal);
router.post('/internal/recipes/validate', recipeController.validateRecipes);

export default router;