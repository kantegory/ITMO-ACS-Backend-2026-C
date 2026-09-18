import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3003,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || 'social.sqlite',
  internalApiKey: process.env.INTERNAL_API_KEY || 'dev-internal-key-change-me',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  recipeServiceUrl: process.env.RECIPE_SERVICE_URL || 'http://localhost:3002',
};
