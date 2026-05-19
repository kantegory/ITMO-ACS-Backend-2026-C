import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { imagesService } from "../services/images.service";
import { serializeImage, serializeItems } from "../utils/serializers";

class ImagesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await imagesService.create(req.body, req.user.id, req.user.role);
      res.status(201).json(serializeImage(result));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = Number(req.query.propertyId);
      if (!propertyId) throw new AppError(400, "Параметр propertyId обязателен");

      const result = await imagesService.getByPropertyId(propertyId);
      res.status(200).json(serializeItems(result, serializeImage));
    } catch (error) {
      next(error);
    }
  }

  async getByPropertyId(req: Request, res: Response, next: NextFunction) {
    req.query.propertyId = req.params.propertyId;
    return this.list(req, res, next);
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      await imagesService.delete(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const imagesController = new ImagesController();
