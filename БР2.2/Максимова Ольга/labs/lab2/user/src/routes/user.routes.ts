import { Router, RequestHandler } from 'express';
import {userController } from '../controllers';
import { authMiddleware } from "../middleware";
import { serviceAuthMiddleware } from "common";

const router = Router();

const authHandler = authMiddleware as RequestHandler;

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/batch', authHandler, userController.getBatch);
router.get('/profile/me', authHandler, userController.getById);
router.get('/:id', authHandler, userController.getById);
router.get('/:id/validate', authHandler, userController.validate);
router.patch('/', authHandler, userController.updateProfile)

router.post('/verify', authMiddleware, userController.verify)
router.patch("/role/:id", authHandler, userController.updateRole);

router.get('/internal/batch', serviceAuthMiddleware, userController.getBatchInternal);

export default router;