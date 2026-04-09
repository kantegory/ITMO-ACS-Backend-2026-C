import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  [
    body('login').isLength({ min: 3, max: 50 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('confPassword').custom((value, { req }) => value === req.body.password),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('login').notEmpty(),
    body('password').notEmpty()
  ],
  validate,
  authController.login
);

router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

export default router;