import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { entities } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.db.synchronize, //проработать момент с синхронизацией
  logging: config.nodeEnv === 'development',
  entities
});
