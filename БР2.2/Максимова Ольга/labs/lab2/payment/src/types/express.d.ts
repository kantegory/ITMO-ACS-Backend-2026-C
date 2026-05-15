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

export type IdParams = {
  id: string;
};

export type RentParams = {
  rentId: string;
};

export type BatchQuery = {
  ids?: string;
};
