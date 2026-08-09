import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { EstateController } from '../controllers/estate.controller';
import { DealController } from '../controllers/deal.controller';
import { SessionController } from '../controllers/session.controller';
import { MessageController } from '../controllers/message.controller';

const router = Router();

const userController = new UserController();
const estateController = new EstateController();
const dealController = new DealController();
const sessionController = new SessionController();
const messageController = new MessageController();


router.get('/users', userController.listUsers);
router.get('/users/:userId', userController.getUser);
router.post('/users', userController.createUser);
router.patch('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.deleteUser);


router.get('/estates', estateController.listEstates);
router.get('/estates/:estateId', estateController.getEstate);
router.post('/estates', estateController.createEstate);
router.patch('/estates/:estateId', estateController.updateEstate);
router.delete('/estates/:estateId', estateController.deleteEstate);


router.get('/deals', dealController.listDeals);
router.get('/deals/:dealId', dealController.getDeal);
router.post('/deals', dealController.createDeal);
router.patch('/deals/:dealId', dealController.updateDeal);
router.delete('/deals/:dealId', dealController.deleteDeal);


router.get('/sessions', sessionController.listSessions);
router.get('/sessions/:sessionId', sessionController.getSession);
router.post('/sessions', sessionController.createSession);
router.delete('/sessions/:sessionId', sessionController.deleteSession);


router.get('/messages', messageController.listMessages);
router.get('/messages/:messageId', messageController.getMessage);
router.post('/messages', messageController.createMessage);
router.patch('/messages/:messageId', messageController.updateMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);

export default router;
