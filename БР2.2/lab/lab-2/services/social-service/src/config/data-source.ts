import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { Favorite } from '../models/favorite.entity';

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: config.dbPath,
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [Comment, Like, Favorite],
});
