import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventPublisher } from '../rabbitmq/publisher';

const userService = new UserService();

export class UserController {
  // Создание пользователя
  async createUser(req: Request, res: Response) {
    try {
      console.log('📥 [UserController] Creating user...');
      console.log('📥 Request body:', req.body);

      const createUserDto = plainToInstance(CreateUserDto, req.body);
      const errors = await validate(createUserDto);
      
      if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        return res.status(400).json({ 
          statusCode: 400,
          errors: errors.map(err => ({
            property: err.property,
            constraints: err.constraints,
          }))
        });
      }

      const user = await userService.create(createUserDto);
      console.log('✅ [UserController] User created successfully:', user.id);

      // Асинхронная публикация события
      const publisher = EventPublisher.getInstance();
      publisher.publishEvent(
        'user.created',
        {
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          dealRole: user.deal_role,
        },
        'user-service'
      ).catch(err => {
        console.error('❌ Failed to publish user.created event:', err);
      });

      res.status(201).json({
        statusCode: 201,
        message: 'User created successfully',
        data: user,
      });

    } catch (error: unknown) {
      console.error('❌ [UserController] Error creating user:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(409).json({
          statusCode: 409,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'User with this email already exists',
          },
        });
      }

      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        },
      });
    }
  }

  // Получение всех пользователей
  async getUsers(req: Request, res: Response) {
    try {
      console.log('📥 [UserController] Fetching all users...');
      const users = await userService.findAll();
      
      res.json({
        statusCode: 200,
        data: users,
        count: users.length,
      });
    } catch (error: unknown) {
      console.error('❌ [UserController] Error fetching users:', error);
      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        },
      });
    }
  }

  // Получение пользователя по ID
  async getUserById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log(`📥 [UserController] Fetching user with ID: ${id}`);
      
      if (isNaN(id)) {
        return res.status(400).json({
          statusCode: 400,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID',
          },
        });
      }

      const user = await userService.findOne(id);
      
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with ID ${id} not found`,
          },
        });
      }

      res.json({
        statusCode: 200,
        data: user,
      });
    } catch (error: unknown) {
      console.error('❌ [UserController] Error fetching user:', error);
      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user',
        },
      });
    }
  }

  // Получение пользователя по email
  async getUserByEmail(req: Request, res: Response) {
    try {
      const email = req.params.email;
      console.log(`📥 [UserController] Fetching user with email: ${email}`);
      
      const user = await userService.findByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with email ${email} not found`,
          },
        });
      }

      res.json({
        statusCode: 200,
        data: user,
      });
    } catch (error: unknown) {
      console.error('❌ [UserController] Error fetching user by email:', error);
      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user by email',
        },
      });
    }
  }

  // Обновление пользователя
  async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log(`📥 [UserController] Updating user with ID: ${id}`);
      console.log('📥 Update data:', req.body);
      
      if (isNaN(id)) {
        return res.status(400).json({
          statusCode: 400,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID',
          },
        });
      }

      const updateUserDto = plainToInstance(UpdateUserDto, req.body);
      const errors = await validate(updateUserDto);
      
      if (errors.length > 0) {
        return res.status(400).json({
          statusCode: 400,
          errors: errors.map(err => ({
            property: err.property,
            constraints: err.constraints,
          }))
        });
      }

      const user = await userService.update(id, updateUserDto);
      
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with ID ${id} not found`,
          },
        });
      }

      const publisher = EventPublisher.getInstance();
      publisher.publishEvent(
        'user.updated',
        {
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        'user-service'
      ).catch(err => {
        console.error('❌ Failed to publish user.updated event:', err);
      });

      res.json({
        statusCode: 200,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error: unknown) {
      console.error('❌ [UserController] Error updating user:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(409).json({
          statusCode: 409,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'Email already in use',
          },
        });
      }

      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user',
        },
      });
    }
  }

  // Удаление пользователя
  async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log(`📥 [UserController] Deleting user with ID: ${id}`);
      
      if (isNaN(id)) {
        return res.status(400).json({
          statusCode: 400,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID',
          },
        });
      }

      const user = await userService.findOne(id);
      
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with ID ${id} not found`,
          },
        });
      }

      await userService.remove(id);

      const publisher = EventPublisher.getInstance();
      publisher.publishEvent(
        'user.deleted',
        {
          userId: id,
          email: user.email,
        },
        'user-service'
      ).catch(err => {
        console.error('❌ Failed to publish user.deleted event:', err);
      });

      res.status(204).send();
    } catch (error: unknown) {
      console.error('❌ [UserController] Error deleting user:', error);
      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user',
        },
      });
    }
  }

  // Проверка существования пользователя по email
  async checkUserExists(req: Request, res: Response) {
    try {
      const email = req.params.email;
      console.log(`📥 [UserController] Checking user exists with email: ${email}`);
      
      const user = await userService.findByEmail(email);
      
      res.json({
        statusCode: 200,
        exists: !!user,
        data: user || null,
      });
    } catch (error: unknown) {
      console.error('❌ [UserController] Error checking user exists:', error);
      res.status(500).json({
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check user existence',
        },
      });
    }
  }
}