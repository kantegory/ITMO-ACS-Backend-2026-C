import { Router } from 'express';
import { param, body } from 'express-validator';
import { CommentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const commentController = new CommentController();

router.get('/:id/comments', [param('id').isInt().toInt()], commentController.getComments);
router.post(
  '/:id/comments',
  authMiddleware,
  [param('id').isInt().toInt(), body('text').notEmpty()],
  commentController.addComment
);

export default router;