import { DataSource } from "typeorm";
import { User } from "./entities/User";

export const AuthDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres", // логин от базы
    password: "password", //  пароль
    database: "auth_db",  // отдельная база для юзеров
    synchronize: true,
    logging: false,
    entities: [User],
});