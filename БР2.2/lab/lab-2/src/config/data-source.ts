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
// Миграции в курсе пока не проходили, поэтому для учебного проекта это осознанно
// упрощённый вариант (в реальном проде так делать не стоит).
export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: config.dbPath,
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [User, Category, Tag, Unit, Recipe, Ingredient, Step, Comment, Like, Favorite],
});
