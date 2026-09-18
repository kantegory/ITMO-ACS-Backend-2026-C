import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  recipeServiceUrl: process.env.RECIPE_SERVICE_URL || 'http://localhost:3002',
  socialServiceUrl: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003',
};
