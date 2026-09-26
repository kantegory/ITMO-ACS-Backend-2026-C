import { env } from 'process';

// Настройки сервиса собраны в одном месте, как в монолите (лр1/src/config/settings.ts).
// Остальной код читает SETTINGS.что-то, а не process.env напрямую.
class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 3002;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    // db connection settings
    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 15433;
    DB_NAME = env.DB_NAME || 'restaurants_db';
    DB_USER = env.DB_USER || 'restaurants_user';
    DB_PASSWORD = env.DB_PASSWORD || 'restaurants_password';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.entity.js';
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'dist/models/*.subscriber.js';

    // jwt settings — общие для всех сервисов, каждый сам проверяет подпись
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5;

    // межсервисные вызовы (раздел 7-8 CLAUDE.md)
    INTERNAL_API_KEY = env.INTERNAL_API_KEY || 'internal-secret';
    AUTH_SERVICE_URL = env.AUTH_SERVICE_URL || 'http://localhost:3001';
    BOOKINGS_SERVICE_URL = env.BOOKINGS_SERVICE_URL || 'http://localhost:3003';

    // очередь сообщений (ДЗ5) — restaurants слушает события брони
    RABBITMQ_HOST = env.RABBITMQ_HOST || 'localhost';
    RABBITMQ_PORT = parseInt(env.RABBITMQ_PORT) || 5673;
    RABBITMQ_USER = env.RABBITMQ_USER || 'rabbitmq';
    RABBITMQ_PASSWORD = env.RABBITMQ_PASSWORD || 'rabbitmq_password';
}

const SETTINGS = new Settings();

export default SETTINGS;
