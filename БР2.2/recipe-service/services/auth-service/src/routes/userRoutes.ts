import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Внимание: /users/me/recipes и /users/me/favorites сюда НЕ попадают —
// шлюз направляет их напрямую в Recipe Service и Social Service соответственно
router.get('/me', requireAuth, userController.me);
router.put('/me', requireAuth, userController.updateMe);

export default router;
