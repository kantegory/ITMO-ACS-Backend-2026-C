// src/types/express.d.ts
import { JwtPayload } from 'jsonwebtoken';

export interface JwtPayloadWithUser extends JwtPayload {
  user: {
    id: string;
    email: string;
    roles: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadWithUser['user'];
    }
  }
}
