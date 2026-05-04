import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: string;
      role: string;
      email: string;
      iat: number;
      exp: number;
    };
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.role,
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Forbidden: token is invalid or expired' });
  }
};