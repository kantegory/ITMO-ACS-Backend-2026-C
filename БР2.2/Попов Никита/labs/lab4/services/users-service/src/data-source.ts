import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";
import { UserEntity } from "./entities/user.entity";

export const dataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  schema: config.db.schema,
  entities: [UserEntity],
  synchronize: true,
  logging: false
});
