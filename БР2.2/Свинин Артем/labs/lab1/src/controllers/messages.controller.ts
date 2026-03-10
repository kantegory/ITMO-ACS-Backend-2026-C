import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { messagesService } from "../services/messages.service";
import { serializeMessage, serializePage } from "../utils/serializers";

class MessagesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const result = await messagesService.create(req.body, req.user.id, req.user.role);
      res.status(201).json(serializeMessage(result));
    } catch (error) {
      next(error);
    }
  }

  async getByChatId(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const chatId = Number(req.query.chatId);
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await messagesService.getByChatId(
        chatId,
        req.user.id,
        req.user.role,
        page,
        pageSize
      );

      res.status(200).json(serializePage(result, serializeMessage));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const id = Number(req.params.id);
      const result = await messagesService.markAsRead(id, req.user.id, req.user.role);
      res.status(200).json(serializeMessage(result));
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
