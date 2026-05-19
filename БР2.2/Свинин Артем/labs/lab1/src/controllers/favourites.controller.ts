import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { favouritesService } from "../services/favourites.service";
import { serializeFavourite, serializeItems } from "../utils/serializers";

class FavouritesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await favouritesService.create(req.body, req.user.id);
      res.status(201).json(serializeFavourite(result));
    } catch (error) {
      next(error);
    }
  }

  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await favouritesService.getMy(req.user.id);
      res.status(200).json(serializeItems(result, serializeFavourite));
    } catch (error) {
      next(error);
    }
  }

  async deleteByPropertyId(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const propertyId = Number(req.params.propertyId);
      await favouritesService.deleteByPropertyId(propertyId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async deleteById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      await favouritesService.deleteById(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const favouritesController = new FavouritesController();
