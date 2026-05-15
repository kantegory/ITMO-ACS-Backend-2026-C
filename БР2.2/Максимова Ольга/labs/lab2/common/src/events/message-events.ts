export interface MessageSent {
  eventType: 'message.sent';
  messageId: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  accommodationId: string;
  timestamp: number;
}
