import { Request, Response } from "express";
import { BookingDataSource } from "../database";
import { Reservation } from "../entities/Reservation";
import axios from "axios";
import { ValidateTokenResponse, RestaurantCheckResponse } from "../../../shared/types";

export class BookingController {
    static async create(req: Request, res: Response) {
        try {
            const { restaurantId, date } = req.body;
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ error: "No token provided" });
            }

            const token = authHeader.split(" ")[1];

            //  межсервисный запрос в auth service: валидируем токен
            let userData: ValidateTokenResponse;
            try {
                const authRes = await axios.post<ValidateTokenResponse>(
                    "http://localhost:4001/internal/validate", 
                    { token }
                );
                userData = authRes.data;
            } catch (err) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // межсервисный запрос в catalog service: проверяем ресторан
            try {
                const catalogRes = await axios.get<RestaurantCheckResponse>(
                    `http://localhost:4002/internal/restaurants/${restaurantId}/check`
                );
                if (!catalogRes.data.isActive) {
                    return res.status(400).json({ error: "Restaurant is closed" });
                }
            } catch (err) {
                return res.status(404).json({ error: "Restaurant not found" });
            }

            // всё ок - сохраняем бронь в своей бд
            const repo = BookingDataSource.getRepository(Reservation);
            const reservation = repo.create({
                userId: userData.userId, // ID от auth service
                restaurantId,            // ID, проверенный в catalog service
                date
            });
            await repo.save(reservation);

            res.status(201).json(reservation);

        } catch (error) {
            res.status(500).json({ error: "Booking Service Error" });
        }
    }
}