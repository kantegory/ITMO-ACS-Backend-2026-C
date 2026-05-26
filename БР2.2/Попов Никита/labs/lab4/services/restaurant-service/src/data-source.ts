import { DataSource } from "typeorm";
import { config } from "./config";
import { MenuItemEntity } from "./entities/menu-item.entity";
import { RestaurantEntity } from "./entities/restaurant.entity";

export const dataSource = new DataSource({
  type: "postgres",
  host: config.dbHost,
  port: config.dbPort,
  username: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  schema: config.dbSchema,
  entities: [RestaurantEntity, MenuItemEntity],
  synchronize: true
});
