import { Request } from 'express';
import settings from '../config/config';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, settings.JWT_SECRET_KEY) as { id: string };
    return decoded.id ?? null;
  } catch {
    return null;
  }
};

export default getUserIdFromToken;