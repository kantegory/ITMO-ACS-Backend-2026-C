import { DataSource } from "typeorm";
import { Restaurant } from "./entities/Restaurant";

export const CatalogDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres", 
    password: "password", 
    database: "catalog_db", 
    synchronize: true,
    entities: [Restaurant],
});