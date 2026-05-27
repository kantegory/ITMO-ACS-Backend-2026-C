import { Router } from 'express';
import { param } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, userController.updateMe);
router.get('/me/subscriptions', authMiddleware, userController.getSubscriptions);
router.post('/:authorId/subscribe', authMiddleware, userController.subscribe);
router.delete('/:authorId/subscribe', authMiddleware, userController.unsubscribe);
router.get('/:id', userController.getUserById);

export default router;