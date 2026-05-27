import { Router } from 'express';
import { param } from 'express-validator';
import { SaveController } from '../controllers/save.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const saveController = new SaveController();

router.post('/:id/save', authMiddleware, [param('id').isInt().toInt()], saveController.save);
router.delete('/:id/save', authMiddleware, [param('id').isInt().toInt()], saveController.unsave);
router.get('/me/saved', authMiddleware, saveController.getSavedRecipes);

export default router;