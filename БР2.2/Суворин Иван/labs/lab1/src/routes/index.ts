import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import recipeRoutes from './recipeRoutes';
import commentRoutes from './commentRoutes';
import adminRoutes from './adminRoutes';
import ingredientRoutes from './ingredientRoutes';
import unitRoutes from './unitRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/recipes', recipeRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/units', unitRoutes);

export default router;
