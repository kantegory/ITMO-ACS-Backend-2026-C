import { Router } from 'express';
import { param, query } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, userController.updateMe);

router.get(
  '/me/subscriptions',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getMySubscriptions
);

router.get(
  '/me/saved-recipes',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getMySavedRecipes
);

router.get(
  '/me/liked-recipes',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getMyLikedRecipes
);

router.get(
  '/me/disliked-recipes',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getMyDislikedRecipes
);

router.get(
  '/me/recipes',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getMyRecipes
);

router.get(
  '/:userId',
  [param('userId').isInt().toInt()],
  validate,
  userController.getUserById
);

router.get(
  '/:userId/recipes',
  [
    param('userId').isInt().toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  userController.getUserRecipes
);

router.post(
  '/:authorId/subscribe',
  authMiddleware,
  [param('authorId').isInt().toInt()],
  validate,
  userController.subscribe
);

router.delete(
  '/:authorId/subscribe',
  authMiddleware,
  [param('authorId').isInt().toInt()],
  validate,
  userController.unsubscribe
);

export default router;