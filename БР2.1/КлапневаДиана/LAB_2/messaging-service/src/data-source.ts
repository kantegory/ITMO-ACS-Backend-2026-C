import { DataSource } from 'typeorm';
import { Session } from './models/Session.entity';
import { Message } from './models/Message.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'messages_db',
  synchronize: true,
  logging: false,
  entities: [Session, Message],  // ← ТОЛЬКО эти сущности
  migrations: [],
  subscribers: [],
});