import { NextFunction, Request, Response } from "express";
import { propertyTypesService } from "../services/property-types.service";
import { serializeItems, serializePropertyType } from "../utils/serializers";

class PropertyTypesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertyTypesService.create(req.body);
      res.status(201).json(serializePropertyType(result));
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertyTypesService.getAll();
      res.status(200).json(serializeItems(result, serializePropertyType));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await propertyTypesService.getById(id);
      res.status(200).json(serializePropertyType(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await propertyTypesService.update(id, req.body);
      res.status(200).json(serializePropertyType(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await propertyTypesService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const propertyTypesController = new PropertyTypesController();
