import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Restaurant } from "../entities/Restaurant";

export class RestaurantController {
    static async listRestaurants(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Restaurant);
        const { city_id, cuisine_id, price_category, name, price_sort, rating_sort } = req.query;

        // используем query builder для сложных фильтров
        const qb = repo.createQueryBuilder("r");

        if (city_id) qb.andWhere("r.city_id = :city_id", { city_id });
        if (cuisine_id) qb.andWhere("r.cuisine_id = :cuisine_id", { cuisine_id });
        if (price_category) qb.andWhere("r.price_category = :price_category", { price_category });
        if (name) qb.andWhere("r.name ILIKE :name", { name: `%${name}%` });

        if (price_sort === "asc" || price_sort === "desc") {
            qb.addOrderBy("r.price_category", price_sort === "asc" ? "ASC" : "DESC");
        }
        if (rating_sort === "asc" || rating_sort === "desc") {
            qb.addOrderBy("r.average_rating", rating_sort === "asc" ? "ASC" : "DESC");
        }

        const restaurants = await qb.getMany();
        res.json(restaurants);
    }

    static async getRestaurant(req: Request, res: Response) {
        const restaurant = await AppDataSource.getRepository(Restaurant).findOneBy({ id: Number(req.params.id) });
        if (!restaurant) return res.status(404).json({ message: "ресторан не найден" });
        res.json(restaurant);
    }
}