import { DataSource } from 'typeorm';
import { Review } from './review.entity';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'liza',
    database: process.env.DB_DATABASE || 'review_db',
    synchronize: true,
    logging: false,
    entities: [Review],
});