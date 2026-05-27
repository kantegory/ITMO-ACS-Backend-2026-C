import { DataSource } from "typeorm";
import { Reservation } from "./entities/Reservation";

export const BookingDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3000),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "booking_db", 
    synchronize: true,
    entities: [Reservation],
});