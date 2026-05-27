import { DataSource } from "typeorm";
import { User } from "./entities/User";

export const AuthDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3000),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "auth_db",  
    synchronize: true,
    logging: false,
    entities: [User],
});