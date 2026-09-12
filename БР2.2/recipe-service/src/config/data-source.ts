import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import {
  User,
  Category,
  Tag,
  Unit,
  Recipe,
  Ingredient,
  Step,
  Comment,
  Like,
  Favorite,
} from '../models';

// synchronize: true — TypeORM сам создаёт/обновляет таблицы по сущностям.
export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: config.dbPath,
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [User, Category, Tag, Unit, Recipe, Ingredient, Step, Comment, Like, Favorite],
});
