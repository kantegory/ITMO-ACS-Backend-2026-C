export class PaymentDto {
  id!: string;
  rent_id!: string;
  amount!: number;
  processed!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

export class CreatePaymentDto {
  rent_id!: string;
  amount!: number;
}