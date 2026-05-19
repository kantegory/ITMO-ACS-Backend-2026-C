import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { reviewsService } from "../services/reviews.service";
import { serializeItems, serializeReview } from "../utils/serializers";

class ReviewsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await reviewsService.create(req.body, req.user.id);
      res.status(201).json(serializeReview(result));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = Number(req.query.propertyId);
      if (!propertyId) throw new AppError(400, "Параметр propertyId обязателен");

      const result = await reviewsService.getByPropertyId(propertyId);
      res.status(200).json(serializeItems(result, serializeReview));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await reviewsService.getById(id);
      res.status(200).json(serializeReview(result));
    } catch (error) {
      next(error);
    }
  }

  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      const result = await reviewsService.respond(id, req.body, req.user.id, req.user.role);
      res.status(200).json(serializeReview(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      await reviewsService.delete(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getByPropertyId(req: Request, res: Response, next: NextFunction) {
    req.query.propertyId = req.params.propertyId;
    return this.list(req, res, next);
  }
}

export const reviewsController = new ReviewsController();
