import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// CRUD операции
router.get('/', userController.getUsers.bind(userController));
router.post('/', userController.createUser.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

// Дополнительные маршруты
router.get('/email/:email', userController.getUserByEmail.bind(userController));
router.get('/check/:email', userController.checkUserExists.bind(userController));

export default router;