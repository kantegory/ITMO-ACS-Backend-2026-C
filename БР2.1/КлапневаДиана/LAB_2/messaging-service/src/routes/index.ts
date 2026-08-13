
import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { MessageController } from '../controllers/message.controller';

const router = Router();
const sessionController = new SessionController();
const messageController = new MessageController();


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