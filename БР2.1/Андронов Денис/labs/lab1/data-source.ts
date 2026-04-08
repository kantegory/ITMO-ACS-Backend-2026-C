import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Restaurant } from "./entities/Restaurant";
import { Reservation } from "./entities/Reservation";
import { Review } from "./entities/Review";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "1234",
  database: "restaurant_db",
  synchronize: true,
  logging: false,
  entities: [User, Restaurant, Reservation, Review],
});