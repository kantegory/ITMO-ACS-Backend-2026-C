import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3002,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || 'recipe.sqlite',
  internalApiKey: process.env.INTERNAL_API_KEY || 'dev-internal-key-change-me',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  socialServiceUrl: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003',
};
