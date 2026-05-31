import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Recipe } from '../entities/Recipe';
import { Step } from '../entities/Step';
import { Ingredient } from '../entities/Ingredient';
import { Cuisine } from '../entities/Cuisine';
import { TypeRecipe } from '../entities/TypeRecipe';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'recipe_db',
  synchronize: process.env.NODE_ENV === 'production',
  logging: process.env.NODE_ENV === 'production',
  entities: [Recipe, Step, Ingredient, Cuisine, TypeRecipe],
});