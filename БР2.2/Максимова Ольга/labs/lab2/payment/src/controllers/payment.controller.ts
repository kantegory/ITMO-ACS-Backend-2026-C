import { Request, Response } from "express";
import PaymentService from "../services/payment.service";
import { PaymentDto, CreatePaymentDto } from "../dto";
import { BatchQuery, IdParams, RentParams } from "../types/express";

class PaymentController {
  async batch(
    req: Request<{}, {}, {}, BatchQuery>,
    res: Response,
  ): Promise<void> {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const payments: PaymentDto[] = await PaymentService.batch(ids);

    if (payments.length === 0) {
      res.status(404).json({ message: "Payments not found" });
      return;
    }

    res.status(200).json(payments);
  }

  async getById(req: Request<IdParams>, res: Response): Promise<void> {
    const payment = await PaymentService.getById(req.params.id);

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json(payment);
  }

  async create(
    req: Request<{}, {}, CreatePaymentDto>,
    res: Response,
  ): Promise<void> {
    const { rent_id, amount } = req.body;

    if (!rent_id || amount === undefined) {
      res.status(400).json({ message: "Missing rent_id or amount" });
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ message: "Invalid amount" });
      return;
    }

    try {
      const payment = await PaymentService.create({
        rent_id,
        amount: numericAmount,
      });

      res.status(201).json(payment);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "Invalid amount") {
        res.status(400).json({ message: "Invalid amount" });
        return;
      }
      res.status(500).json({ message: "Internal error" });
    }
  }

  async getByRent(req: Request<RentParams>, res: Response): Promise<void> {
    const payments = await PaymentService.getByRent(req.params.rentId);

    if (payments.length === 0) {
      res.status(404).json({ message: "Rent not found or no payments" });
      return;
    }

    res.status(200).json(payments);
  }

  async process(req: Request<IdParams>, res: Response): Promise<void> {
    try {
      const payment = await PaymentService.process(req.params.id);
      res.status(200).json(payment);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "Payment not found") {
        res.status(404).json({ message: "Payment not found" });
        return;
      }
      if (message === "Payment already processed") {
        res.status(400).json({ message: "Payment already processed" });
        return;
      }
      res.status(500).json({ message: "Internal error" });
    }
  }
}

export default new PaymentController();
