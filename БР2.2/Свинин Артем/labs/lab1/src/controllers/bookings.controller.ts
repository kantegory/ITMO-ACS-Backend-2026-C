import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { BookingStatus } from "../models/Booking";
import { bookingsService } from "../services/bookings.service";
import { serializeBooking, serializeItems } from "../utils/serializers";

const parseStatus = (value: unknown): BookingStatus | undefined => {
  if (typeof value !== "string") return undefined;
  return Object.values(BookingStatus).includes(value as BookingStatus)
    ? (value as BookingStatus)
    : undefined;
};

class BookingsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await bookingsService.create(req.body, req.user.id);
      res.status(201).json(serializeBooking(result));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await bookingsService.getAll({
        propertyId: req.query.propertyId ? Number(req.query.propertyId) : undefined,
        status: parseStatus(req.query.status),
        startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      });

      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || items.length || 1;

      res.status(200).json({
        items: serializeItems(items, serializeBooking),
        total: items.length,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }

  async incoming(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const items = await bookingsService.getIncoming(req.user.id, {
        propertyId: req.query.propertyId ? Number(req.query.propertyId) : undefined,
        status: parseStatus(req.query.status),
      });

      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || items.length || 1;

      res.status(200).json({
        items: serializeItems(items, serializeBooking),
        total: items.length,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const items = await bookingsService.getMy(req.user.id);
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || items.length || 1;

      res.status(200).json({
        items: serializeItems(items, serializeBooking),
        total: items.length,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const id = Number(req.params.id);
      const result = await bookingsService.getById(id, req.user.id, req.user.role);
      res.status(200).json(serializeBooking(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const id = Number(req.params.id);
      const result = await bookingsService.update(id, req.body, req.user.id, req.user.role);
      res.status(200).json(serializeBooking(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const id = Number(req.params.id);
      await bookingsService.delete(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    req.body = { ...req.body, status: BookingStatus.CONFIRMED };
    return this.update(req, res, next);
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    req.body = { ...req.body, status: BookingStatus.CANCELLED };
    return this.update(req, res, next);
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    req.body = { ...req.body, status: BookingStatus.COMPLETED };
    return this.update(req, res, next);
  }
}

export const bookingsController = new BookingsController();
