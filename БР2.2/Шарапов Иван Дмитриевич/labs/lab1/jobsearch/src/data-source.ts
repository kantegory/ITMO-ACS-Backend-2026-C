import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { Resume } from "./entities/Resume";
import { Company } from "./entities/Company";
import { Vacancy } from "./entities/Vacancy";
import { Application } from "./entities/Application";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "jobsearch",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Resume, Company, Vacancy, Application],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
