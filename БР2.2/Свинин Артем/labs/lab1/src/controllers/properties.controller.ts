import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { propertiesService } from "../services/properties.service";
import { serializeItems, serializeProperty } from "../utils/serializers";

class PropertiesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await propertiesService.create(req.body, req.user.id);
      res.status(201).json(serializeProperty(result));
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertiesService.getAll();
      res.status(200).json(serializeItems(result, serializeProperty));
    } catch (error) {
      next(error);
    }
  }

  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await propertiesService.getMy(req.user.id);
      res.status(200).json(serializeItems(result, serializeProperty));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await propertiesService.getById(id);
      res.status(200).json(serializeProperty(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      const result = await propertiesService.update(id, req.body, req.user.id, req.user.role);
      res.status(200).json(serializeProperty(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      await propertiesService.delete(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const propertiesController = new PropertiesController();
