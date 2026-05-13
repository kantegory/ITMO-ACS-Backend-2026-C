import { DataSource } from "typeorm";
import { Reservation } from "./entities/Reservation";

export const BookingDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 3000,
    username: "postgres",
    password: "password",
    database: "booking_db", 
    synchronize: true,
    entities: [Reservation],
});