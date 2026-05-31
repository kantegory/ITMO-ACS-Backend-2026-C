import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Reaction } from '../entities/Reaction';
import { SavedRecipe } from '../entities/SavedRecipe';
import { Comment } from '../entities/Comment';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'engagement_db',
  synchronize: process.env.NODE_ENV === 'production',
  logging: process.env.NODE_ENV === 'production',
  entities: [Reaction, SavedRecipe, Comment],
});