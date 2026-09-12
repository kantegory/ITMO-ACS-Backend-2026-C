import { Router } from 'express';
import * as internalController from '../controllers/internalController';
import { requireInternalKey } from '../middleware/internalAuthMiddleware';

const router = Router();

router.use(requireInternalKey);
router.get('/users', internalController.getUsers);
router.get('/users/:id', internalController.getUser);

export default router;
