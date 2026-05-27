import { Request, Response } from "express";
import { CatalogDataSource } from "../database";
import { Restaurant } from "../entities/Restaurant";

export class RestaurantController {
    static async create(req: Request, res: Response) {
        const repo = CatalogDataSource.getRepository(Restaurant);
        const restaurant = repo.create(req.body);
        await repo.save(restaurant);
        res.status(201).json(restaurant);
    }
}
