import { Request, Response } from "express";
import { AppDataSource } from "../routes/index";
import { Reservation } from "../entities/Reservation";
import { Restaurant } from "../entities/Restaurant"; // Для поиска по имени ресторана

export class ReservationController {
    static async createReservation(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Reservation);
        const { restaurant_id, reservation_time, guests_count } = req.body;

        const reservation = repo.create({
            user_id: req.user!.id,
            restaurant_id,
            reservation_time,
            guests_count
        });

        await repo.save(reservation);
        res.status(201).json(reservation);
    }

    static async getUserReservations(req: Request, res: Response) {
        // этот метод защищен adminMiddleware в роутах
        const repo = AppDataSource.getRepository(Reservation);
        const reservations = await repo.find({ where: { user_id: Number(req.params.userId) } });
        res.json(reservations);
    }

    static async getMyReservations(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Reservation);
        const { from_date, to_date, restaurant_id, name, sort_by_date } = req.query;

        const qb = repo.createQueryBuilder("res");
        qb.where("res.user_id = :userId", { userId: req.user!.id });

        if (from_date) qb.andWhere("res.reservation_time >= :from", { from: from_date });
        if (to_date) qb.andWhere("res.reservation_time <= :to", { to: to_date });
        if (restaurant_id) qb.andWhere("res.restaurant_id = :restId", { restId: restaurant_id });

        // если ищем по названию ресторана, делаем join
        if (name) {
            qb.leftJoin(Restaurant, "rest", "rest.id = res.restaurant_id");
            qb.andWhere("rest.name ILIKE :name", { name: `%${name}%` });
        }

        if (sort_by_date === "asc" || sort_by_date === "desc") {
            qb.orderBy("res.reservation_time", sort_by_date === "asc" ? "ASC" : "DESC");
        }

        const reservations = await qb.getMany();
        res.json(reservations);
    }
}