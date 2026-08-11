import { DataSource } from 'typeorm';
import { User } from './models/User.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'users_db',
  synchronize: true,
  logging: false,
  entities: [User],  // ← ТОЛЬКО эта сущность
  migrations: [],
  subscribers: [],
});
