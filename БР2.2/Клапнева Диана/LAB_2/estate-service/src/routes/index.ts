import { Router } from 'express';
import { EstateController } from '../controllers/estate.controller';

const router = Router();
const estateController = new EstateController();

router.get('/', estateController.listEstates);
router.get('/:estateId', estateController.getEstate);
router.post('/', estateController.createEstate);
router.patch('/:estateId', estateController.updateEstate);
router.delete('/:estateId', estateController.deleteEstate);

export default router;