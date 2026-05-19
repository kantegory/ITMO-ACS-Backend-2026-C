import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { transactionsService } from "../services/transactions.service";
import { serializeItems, serializeTransaction } from "../utils/serializers";

class TransactionsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await transactionsService.create(req.body, req.user.id, req.user.role);
      res.status(201).json(serializeTransaction(result));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const bookingId = Number(req.query.bookingId);
      if (!bookingId) throw new AppError(400, "Параметр bookingId обязателен");

      const result = await transactionsService.getByBookingId(bookingId, req.user.id, req.user.role);

      res.status(200).json({
        items: serializeItems(result, serializeTransaction),
        total: result.length,
        page: 1,
        pageSize: result.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      const result = await transactionsService.getById(id, req.user.id, req.user.role);
      res.status(200).json(serializeTransaction(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    return this.refund(req, res, next);
  }

  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      const result = await transactionsService.refund(id, req.user.id, req.user.role);
      res.status(200).json(serializeTransaction(result));
    } catch (error) {
      next(error);
    }
  }

  async getByBookingId(req: Request, res: Response, next: NextFunction) {
    req.query.bookingId = req.params.bookingId;
    return this.list(req, res, next);
  }
}

export const transactionsController = new TransactionsController();
