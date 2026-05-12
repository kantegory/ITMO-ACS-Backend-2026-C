import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { RecipeController } from '../controllers/recipe.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const recipeController = new RecipeController();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('typeId').optional().isInt().toInt(),
    query('cuisineId').optional().isInt().toInt(),
    query('ingredients').optional().isString()
  ],
  validate,
  recipeController.list
);

router.get(
  '/:recipeId',
  [param('recipeId').isInt().toInt()],
  validate,
  recipeController.getById
);

router.post(
  '/',
  authMiddleware,
  [
    body('typeId').isInt(),
    body('cuisineId').isInt(),
    body('title').notEmpty().isLength({ max: 200 }),
    body('desc').notEmpty(),
    body('imageUrl').isURL(),
    body('videoUrl').optional().isURL(),
    body('cookTime').isInt({ min: 1 }),
    body('peopleAmount').isInt({ min: 1 }),
    body('steps').isArray(),
    body('ingredients').isArray(),
    body('isPublished').isBoolean()
  ],
  validate,
  recipeController.create
);

router.patch(
  '/:recipeId',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  recipeController.update
);

router.delete(
  '/:recipeId',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  recipeController.delete
);

router.post(
  '/:recipeId/publish',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  recipeController.publish
);

export default router;