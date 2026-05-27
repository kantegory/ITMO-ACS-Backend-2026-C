import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  [
    body('login').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('confPassword').custom((value, { req }) => value === req.body.password),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
  ],
  authController.register
);

router.post(
  '/login',
  [body('login').notEmpty(), body('password').notEmpty()],
  authController.login
);

router.post('/logout', authMiddleware, authController.logout);

router.get('/internal/users/:id', authController.getUserById);
router.post('/internal/users/batch', authController.getUsersBatch);

export default router;