import { JwtPayload } from 'jsonwebtoken';
import { Rent } from '../models/rent.entity'

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


export type IdParams = { id: string };
export type InternalAccomQuery = { ids?: string };
export type BatchQuery = { ids?: string };

export type RentCreationResult =
  | { success: true; rent: Rent }
  | { success: false; error: string };

export type AvailabilityResponse = {
  available: boolean;
  reason?: string;
  landlordId?: string;
  totalAmount?: number;
};
