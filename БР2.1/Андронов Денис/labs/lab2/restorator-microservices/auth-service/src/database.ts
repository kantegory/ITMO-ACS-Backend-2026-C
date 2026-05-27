import { DataSource } from "typeorm";
import { User } from "./entities/User";

export const AuthDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 3000,
    username: "postgres", 
    password: "password", 
    database: "auth_db",  
    synchronize: true,
    logging: false,
    entities: [User],
});