import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { Restaurant } from "./entities/Restaurant";
import { Reservation } from "./entities/Reservation";
import { Region } from "./entities/Region";
import { City } from "./entities/City";
import { Cuisine } from "./entities/Cuisine";
import { RestaurantPhoto } from "./entities/RestaurantPhoto";
import { Review } from "./entities/Review";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [User, Restaurant, Reservation, Region, City, Cuisine, RestaurantPhoto, Review],
    synchronize: true,
    logging: false,
});