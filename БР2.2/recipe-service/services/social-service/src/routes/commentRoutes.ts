import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/recipe/:recipeId', commentController.list);
router.post('/recipe/:recipeId', requireAuth, commentController.add);
router.delete('/:id', requireAuth, commentController.remove);

export default router;
