import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

export const db = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [__dirname + "/entities/*.{ts,js}"],
  synchronize: false,
});
