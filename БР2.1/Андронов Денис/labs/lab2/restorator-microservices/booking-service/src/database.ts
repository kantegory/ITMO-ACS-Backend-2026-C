import { DataSource } from "typeorm";
import { Reservation } from "./entities/Reservation";

export const BookingDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "password",
    database: "booking_db", // Своя независимая база!
    synchronize: true,
    entities: [Reservation],
});