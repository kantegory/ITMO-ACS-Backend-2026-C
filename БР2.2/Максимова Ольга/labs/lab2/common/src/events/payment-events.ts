export interface PaymentProcessed {
  eventType: 'payment.processed';
  paymentId: string;
  rentId: string;
  amount: number;
  status: 'captured';
  timestamp: number;
}

export interface PaymentFailed {
  eventType: 'payment.failed';
  rentId: string;
  reason: string;
  timestamp: number;
}