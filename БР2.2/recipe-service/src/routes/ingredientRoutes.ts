import { Router } from 'express';
import * as ingredientController from '../controllers/ingredientController';

const router = Router();

router.get('/', ingredientController.list);

export default router;
