import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { chatsService } from "../services/chats.service";
import { serializeChat, serializeItems } from "../utils/serializers";

class ChatsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const result = await chatsService.create(req.body, req.user.id, req.user.role);
      res.status(201).json(serializeChat(result));
    } catch (error) {
      next(error);
    }
  }

  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
      const bookingId = req.query.bookingId ? Number(req.query.bookingId) : undefined;

      const result = await chatsService.getMy(req.user.id, { propertyId, bookingId });
      res.status(200).json(serializeItems(result, serializeChat));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const id = Number(req.params.id);
      const result = await chatsService.getById(id, req.user.id, req.user.role);
      res.status(200).json(serializeChat(result));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;

      const result = await chatsService.getAllForAdmin(req.user.role, { propertyId, userId });
      res.status(200).json(serializeItems(result, serializeChat));
    } catch (error) {
      next(error);
    }
  }
}

export const chatsController = new ChatsController();
