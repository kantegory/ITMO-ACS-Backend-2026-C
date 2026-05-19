import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Booking } from "./Booking";

// Возможные статусы транзакции
export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

// Возможные способы оплаты
export enum PaymentMethod {
  CARD = "CARD",
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
}

@Entity("transactions")
export class Transaction {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на бронирование
  @Column({ name: "booking_id" })
  bookingId!: number;

  // Способ оплаты
  @Column({
    name: "payment_method",
    type: "enum",
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  // Статус оплаты
  @Column({
    name: "status",
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  // Дата платежа
  @CreateDateColumn({ name: "transaction_date" })
  transactionDate!: Date;

  // Внешний идентификатор платежа
  @Column({ name: "payment_id", length: 100, nullable: true })
  paymentId?: string;

  // Валюта
  @Column({ name: "currency", length: 10, default: "USD" })
  currency!: string;

  // Сумма платежа
  @Column({ name: "amount", type: "decimal", precision: 10, scale: 2 })
  amount!: string;

  // Комиссия
  @Column({ name: "fee_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
  feeAmount!: string;

  // Сумма возврата
  @Column({ name: "refunded_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
  refundedAmount!: string;

  // Связь с бронированием
  @ManyToOne(() => Booking, { eager: true })
  @JoinColumn({ name: "booking_id" })
  booking!: Booking;
}
