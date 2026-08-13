import { DataSource } from 'typeorm';
import { Estate } from './models/Estate.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'estates_db',
  synchronize: true,
  logging: false,
  entities: [Estate],  // ← ТОЛЬКО эта сущность
  migrations: [],
  subscribers: [],
});