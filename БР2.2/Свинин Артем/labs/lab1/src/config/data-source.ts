import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "./env";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.DB_SYNCHRONIZE,
  logging: false,
  entities: [path.join(__dirname, "../models/**/*.{ts,js}")],
  migrations: [],
  subscribers: [],
});
