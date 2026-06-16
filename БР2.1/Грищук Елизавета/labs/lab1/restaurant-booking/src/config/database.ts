import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Booking } from '../entities/Booking';
import { Review } from '../entities/Review';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'restaurant_booking',
  synchronize: true,
  logging: false,
  entities: [User, Category, Restaurant, Table, Booking, Review],
});
