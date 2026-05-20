import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { CommentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const commentController = new CommentController();

router.get(
  '/:recipeId/comments',
  [
    param('recipeId').isInt().toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  commentController.getComments
);

router.post(
  '/:recipeId/comments',
  authMiddleware,
  [
    param('recipeId').isInt().toInt(),
    body('text').notEmpty().isLength({ max: 1000 })
  ],
  validate,
  commentController.addComment
);

router.delete(
  '/comments/:commentId',
  authMiddleware,
  [param('commentId').isInt().toInt()],
  validate,
  commentController.deleteComment
);

export default router;