import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { Category } from '../models/category.entity';
import { Tag } from '../models/tag.entity';
import { Unit } from '../models/unit.entity';
import { Recipe } from '../models/recipe.entity';
import { Ingredient } from '../models/ingredient.entity';
import { Step } from '../models/step.entity';

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: config.dbPath,
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [Category, Tag, Unit, Recipe, Ingredient, Step],
});
