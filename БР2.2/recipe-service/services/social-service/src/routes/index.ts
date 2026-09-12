import { Router } from 'express';
import recipeInteractionRoutes from './recipeInteractionRoutes';
import meRoutes from './meRoutes';
import commentRoutes from './commentRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/recipes', recipeInteractionRoutes);
router.use('/users/me', meRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

export default router;
