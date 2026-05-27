import { DataSource } from "typeorm";
import { config } from "./config";
import { BookingEntity } from "./entities/booking.entity";

export const dataSource = new DataSource({
  type: "postgres",
  host: config.dbHost,
  port: config.dbPort,
  username: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  schema: config.dbSchema,
  entities: [BookingEntity],
  synchronize: true
});
