import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  db: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'booking_api_user',
    password: process.env.DATABASE_PASSWORD ?? 'booking_api_password',
    database: process.env.DATABASE_NAME ?? 'booking_api',
    synchronize: (process.env.DATABASE_SYNCHRONIZE ?? 'true') === 'true'
  },
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret',
  corsOrigin: process.env.CORS_ORIGIN ?? '*'
};
