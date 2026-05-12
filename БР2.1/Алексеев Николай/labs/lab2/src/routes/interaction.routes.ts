import { Router } from 'express';
import { param } from 'express-validator';
import { InteractionController } from '../controllers/interaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const interactionController = new InteractionController();

router.post(
  '/:recipeId/like',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.like
);

router.delete(
  '/:recipeId/like',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.unlike
);

router.post(
  '/:recipeId/dislike',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.dislike
);

router.delete(
  '/:recipeId/dislike',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.undislike
);

router.post(
  '/:recipeId/save',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.save
);

router.delete(
  '/:recipeId/save',
  authMiddleware,
  [param('recipeId').isInt().toInt()],
  validate,
  interactionController.unsave
);

export default router;