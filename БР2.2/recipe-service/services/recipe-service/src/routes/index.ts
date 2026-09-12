import { Router } from 'express';
import recipeRoutes from './recipeRoutes';
import meRoutes from './meRoutes';
import adminRoutes from './adminRoutes';
import ingredientRoutes from './ingredientRoutes';
import unitRoutes from './unitRoutes';

const router = Router();

router.use('/recipes', recipeRoutes);
router.use('/users/me', meRoutes);
router.use('/admin', adminRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/units', unitRoutes);

export default router;
