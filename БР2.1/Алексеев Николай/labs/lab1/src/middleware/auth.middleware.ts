import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized: No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized: User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Unauthorized: Invalid or expired token'
    });
  }
};