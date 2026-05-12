import { Request, Response } from "express";
import { CatalogDataSource } from "../database";
import { Restaurant } from "../entities/Restaurant";
import { RestaurantCheckResponse } from "../../../shared/types";

export class RestaurantController {
    // Создать ресторан 
    static async create(req: Request, res: Response) {
        const repo = CatalogDataSource.getRepository(Restaurant);
        const restaurant = repo.create(req.body);
        await repo.save(restaurant);
        res.status(201).json(restaurant);
    }

    // Внутренний эндпоинт (Для Booking Service)
    static async checkRestaurant(req: Request, res: Response) {
        const repo = CatalogDataSource.getRepository(Restaurant);
        const restaurant = await repo.findOneBy({ id: parseInt(req.params.id as string) });

        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const response: RestaurantCheckResponse = {
            id: restaurant.id,
            name: restaurant.name,
            isActive: restaurant.isActive
        };
        res.json(response);
    }
}