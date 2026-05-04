import { JwtPayload } from 'jsonwebtoken';
import { Role } from 'common'

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

export type MessageIdParams = {
  id: string;
};

export type MessageAccomParams = {
  accomId: string;
};

export type MessageBatchQuery = {
  ids?: string;
};

export type MessageConversationQuery = {
  user2?: string;
  limit?: string;
  offset?: string;
};

export type CreateMessageBody = {
  sender_id: string;
  receiver_id: string;
  content: string;
  sender_role?: Role;
  accommodation_id?: string;
};
