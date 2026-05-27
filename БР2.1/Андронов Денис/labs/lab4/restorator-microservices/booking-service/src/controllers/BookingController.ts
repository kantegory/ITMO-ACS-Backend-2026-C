import { Request, Response } from "express";
import { BookingDataSource } from "../database";
import { Reservation } from "../entities/Reservation";
import {
    EXCHANGES,
    QUEUES,
    ROUTING_KEYS,
    publishEvent,
    rpcCall,
} from "../../../shared/rabbitmq";
import {
    ReservationCreatedEvent,
    RestaurantCheckResponse,
    ValidateTokenResponse,
} from "../../../shared/types";

export class BookingController {
    static async create(req: Request, res: Response) {
        try {
            const { restaurantId, date } = req.body;
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ error: "No token provided" });
            }

            const token = authHeader.split(" ")[1];

            const userData = await rpcCall<ValidateTokenResponse>(
                QUEUES.AUTH_VALIDATE,
                { token }
            );

            if (!userData.isValid || !userData.userId) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const restaurantData = await rpcCall<RestaurantCheckResponse>(
                QUEUES.CATALOG_CHECK,
                { restaurantId }
            );

            if (!restaurantData.found) {
                return res.status(404).json({ error: "Restaurant not found" });
            }

            if (!restaurantData.isActive) {
                return res.status(400).json({ error: "Restaurant is closed" });
            }

            const repo = BookingDataSource.getRepository(Reservation);
            const reservation = repo.create({
                userId: userData.userId,
                restaurantId,
                date,
            });
            await repo.save(reservation);

            const event: ReservationCreatedEvent = {
                reservationId: reservation.id,
                userId: reservation.userId,
                restaurantId: reservation.restaurantId,
                date: reservation.date,
            };

            await publishEvent(
                EXCHANGES.RESERVATION,
                ROUTING_KEYS.RESERVATION_CREATED,
                event
            );

            res.status(201).json(reservation);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Booking Service Error" });
        }
    }
}
