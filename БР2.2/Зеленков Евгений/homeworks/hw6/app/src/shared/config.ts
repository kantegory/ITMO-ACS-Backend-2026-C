import dotenv from 'dotenv';

dotenv.config();

function numberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  return parsed;
}

function stringEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  nodeEnv: stringEnv('NODE_ENV', 'development'),
  jwtSecret: stringEnv('JWT_SECRET', 'dev_secret'),
  serviceToken: stringEnv('SERVICE_TOKEN', 'dev_service_token'),
  databaseSynchronize: stringEnv('DATABASE_SYNCHRONIZE', 'false') === 'true',
  ports: {
    gateway: numberEnv('API_GATEWAY_PORT', 3105),
    identity: numberEnv('IDENTITY_PORT', 3111),
    catalog: numberEnv('CATALOG_PORT', 3112),
    menu: numberEnv('MENU_PORT', 3113),
    reservation: numberEnv('RESERVATION_PORT', 3114),
    review: numberEnv('REVIEW_PORT', 3115)
  },
  services: {
    identity: stringEnv('IDENTITY_SERVICE_URL', 'http://localhost:3111'),
    catalog: stringEnv('CATALOG_SERVICE_URL', 'http://localhost:3112'),
    menu: stringEnv('MENU_SERVICE_URL', 'http://localhost:3113'),
    reservation: stringEnv('RESERVATION_SERVICE_URL', 'http://localhost:3114'),
    review: stringEnv('REVIEW_SERVICE_URL', 'http://localhost:3115')
  },
  rabbitmq: {
    url: stringEnv('RABBITMQ_URL', 'amqp://booking_user:booking_password@localhost:5673'),
    exchange: stringEnv('RABBITMQ_EXCHANGE', 'booking.events')
  },
  databases: {
    identity: stringEnv('IDENTITY_DATABASE_URL', 'postgres://booking_user:booking_password@localhost:5435/identity_db'),
    catalog: stringEnv('CATALOG_DATABASE_URL', 'postgres://booking_user:booking_password@localhost:5435/restaurant_catalog_db'),
    menu: stringEnv('MENU_DATABASE_URL', 'postgres://booking_user:booking_password@localhost:5435/menu_db'),
    reservation: stringEnv('RESERVATION_DATABASE_URL', 'postgres://booking_user:booking_password@localhost:5435/reservation_db'),
    review: stringEnv('REVIEW_DATABASE_URL', 'postgres://booking_user:booking_password@localhost:5435/review_db')
  }
};

if (config.nodeEnv === 'production') {
  if (config.jwtSecret === 'dev_secret') throw new Error('JWT_SECRET must be set in production');
  if (config.serviceToken === 'dev_service_token') throw new Error('SERVICE_TOKEN must be set in production');
  if (config.databaseSynchronize) throw new Error('DATABASE_SYNCHRONIZE must be disabled in production');
}
