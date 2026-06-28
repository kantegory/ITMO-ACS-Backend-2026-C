import { DataSource } from 'typeorm';
import { Category } from './category.entity';
import { Restaurant } from './restaurant.entity';
import { Table } from './table.entity';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'liza',
    database: process.env.DB_DATABASE || 'restaurant_db',
    synchronize: true,
    logging: false,
    entities: [Category, Restaurant, Table],
});