import { NextFunction, Request, Response } from "express";
import { facilitiesService } from "../services/facilities.service";
import { serializeFacility, serializeItems } from "../utils/serializers";

class FacilitiesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await facilitiesService.create(req.body);
      res.status(201).json(serializeFacility(result));
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await facilitiesService.getAll();
      res.status(200).json(serializeItems(result, serializeFacility));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await facilitiesService.update(id, req.body);
      res.status(200).json(serializeFacility(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await facilitiesService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const facilitiesController = new FacilitiesController();
