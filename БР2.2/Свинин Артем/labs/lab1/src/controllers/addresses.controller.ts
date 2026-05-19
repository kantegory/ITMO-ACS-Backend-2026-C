import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { addressesService } from "../services/addresses.service";
import { serializeAddress, serializeItems } from "../utils/serializers";

class AddressesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await addressesService.create(req.body);
      res.status(201).json(serializeAddress(result));
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressesService.getAll();
      res.status(200).json(serializeItems(result, serializeAddress));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await addressesService.getById(id);
      res.status(200).json(serializeAddress(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      const result = await addressesService.update(id, req.body, req.user.id, req.user.role);
      res.status(200).json(serializeAddress(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const id = Number(req.params.id);
      await addressesService.delete(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const addressesController = new AddressesController();
