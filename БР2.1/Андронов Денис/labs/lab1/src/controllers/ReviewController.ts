import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { Review } from "../entities/Review";

export class ReviewController {
    static async createReview(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Review);
        const { restaurant_id, rating, comment } = req.body;

        const review = repo.create({
            user_id: req.user!.id,
            restaurant_id,
            rating,
            comment
        });

        await repo.save(review);
        res.status(201).json(review);
    }

    static async getRestaurantReviews(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Review);
        const { rating_sort } = req.query;
        const restaurant_id = Number(req.params.restaurantId);

        const qb = repo.createQueryBuilder("rev").where("rev.restaurant_id = :restaurant_id", { restaurant_id });

        if (rating_sort === "asc" || rating_sort === "desc") {
            qb.orderBy("rev.rating", rating_sort === "asc" ? "ASC" : "DESC");
        }

        const reviews = await qb.getMany();
        res.json(reviews);
    }
}