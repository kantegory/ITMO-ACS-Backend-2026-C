import { Router } from 'express';
import { param, body } from 'express-validator';
import { ReactionController } from '../controllers/reaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const reactionController = new ReactionController();

// POST /api/recipes/:id/react - с телом { "type": "like" } или { "type": "dislike" }
router.post(
  '/:id/react',
  authMiddleware,
  [param('id').isInt().toInt(), body('type').isIn(['like', 'dislike'])],
  reactionController.react
);

// DELETE /api/recipes/:id/react - удалить реакцию
router.delete('/:id/react', authMiddleware, [param('id').isInt().toInt()], reactionController.removeReaction);

// GET /api/users/me/likes
router.get('/me/likes', authMiddleware, reactionController.getLikedRecipes);

// GET /api/users/me/dislikes
router.get('/me/dislikes', authMiddleware, reactionController.getDislikedRecipes);

// Internal
router.get('/internal/recipes/:id/counters', reactionController.getCounters);

export default router;