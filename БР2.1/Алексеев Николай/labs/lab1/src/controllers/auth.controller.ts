import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  register = async (req: Request, res: Response) => {
    try {
      const { login, email, password, confPassword, firstName, lastName } = req.body;

      if (password !== confPassword) {
        return res.status(401).json({
          code: 401,
          message: 'Unauthorized: Invalid credentials or session expired'
        });
      }

      const existingUser = await this.userRepository.findOne({
        where: [{ login }, { email }]
      });

      if (existingUser) {
        return res.status(409).json({
          code: 409,
          message: 'Conflict: Duplicate resource or constraint violation'
        });
      }

      const user = this.userRepository.create({
        login,
        email,
        password,
        firstName,
        lastName
      });

      await this.userRepository.save(user);

      const token = jwt.sign(
        { userId: user.id, login: user.login, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        accessToken: token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { login, password } = req.body;

      const user = await this.userRepository.findOne({
        where: [{ login }, { email: login }]
      });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          code: 401,
          message: 'Unauthorized: Invalid credentials or session expired'
        });
      }

      const token = jwt.sign(
        { userId: user.id, login: user.login, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        accessToken: token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      res.status(204).send();
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };
}