import jwt from 'jsonwebtoken';
import { config } from '../config/config';

// В отличие от auth-service, здесь нет собственной модели User —
// роль описываем тем же простым типом прямо здесь.
export type UserRole = 'user' | 'admin';

export interface TokenPayload {
  id: number;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
