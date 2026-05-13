import { Router } from 'express';
import { param } from 'express-validator';
import { LikeController } from '../controllers/like.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const likeController = new LikeController();

router.post('/:id/like', authMiddleware, [param('id').isInt().toInt()], likeController.like);
router.delete('/:id/like', authMiddleware, [param('id').isInt().toInt()], likeController.unlike);
router.post('/:id/dislike', authMiddleware, [param('id').isInt().toInt()], likeController.dislike);
router.delete('/:id/dislike', authMiddleware, [param('id').isInt().toInt()], likeController.undislike);
router.get('/me/likes', authMiddleware, likeController.getLikedRecipes);
router.get('/me/dislikes', authMiddleware, likeController.getDislikedRecipes);

router.get('/internal/recipes/:id/counters', likeController.getCounters);

export default router;