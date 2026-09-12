import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from '../models/user.entity';

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: config.dbPath,
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [User],
});
