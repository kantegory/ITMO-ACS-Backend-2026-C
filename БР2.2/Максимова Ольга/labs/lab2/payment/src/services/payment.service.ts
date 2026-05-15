import { Repository, In } from "typeorm";
import dataSource from "../config/data-source";
import { Payment } from "../models/payment.entity";
import { publish } from "common";
import { Topics } from "common";

export class PaymentService {
  private paymentRepo: Repository<Payment>;

  constructor() {
    this.paymentRepo = dataSource.getRepository(Payment);
  }

  async batch(ids: string[]): Promise<Payment[]> {
    if (!ids.length) return [];
    return this.paymentRepo.findBy({ id: In(ids) });
  }

  async getById(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOneBy({ id });
  }

  async create(payload: { rent_id: string; amount: number }): Promise<Payment> {
    if (payload.amount <= 0) throw new Error("Invalid amount");

    const payment = this.paymentRepo.create({
      rent_id: payload.rent_id,
      amount: payload.amount,
      processed: false,
    });
    await this.paymentRepo.save(payment);

    await publish(Topics.Payment, {
      eventType: "payment.created",
      paymentId: payment.id,
      rentId: payment.rent_id,
      amount: payment.amount,
      timestamp: Date.now(),
    });

    return payment;
  }

  async getByRent(rentId: string): Promise<Payment[]> {
    return this.paymentRepo.find({ where: { rent_id: rentId } });
  }

  async process(id: string): Promise<Payment> {
    const payment = await this.getById(id);
    if (!payment) throw new Error("Payment not found");
    if (payment.processed) throw new Error("Payment already processed");

    payment.processed = true;
    payment.updated_at = new Date();
    await this.paymentRepo.save(payment);

    await publish(Topics.Payment, {
      eventType: "payment.processed",
      paymentId: payment.id,
      rentId: payment.rent_id,
      amount: payment.amount,
      status: "captured",
      timestamp: Date.now(),
    });

    return payment;
  }

  async hold(rentId: string, tenantId: string, amount: number) {
    const payment = await this.create({ rent_id: rentId, amount: amount });
    return payment.id;
  }
}

export default new PaymentService();
