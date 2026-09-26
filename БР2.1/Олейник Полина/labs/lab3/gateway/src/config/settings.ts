import { env } from 'process';

// Настройки gateway собраны в одном месте, как и в остальных сервисах
// (services/*/src/config/settings.ts) — остальной код читает SETTINGS.что-то.
class Settings {
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8080;
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    AUTH_SERVICE_URL = env.AUTH_SERVICE_URL || 'http://localhost:3001';
    RESTAURANTS_SERVICE_URL = env.RESTAURANTS_SERVICE_URL || 'http://localhost:3002';
    BOOKINGS_SERVICE_URL = env.BOOKINGS_SERVICE_URL || 'http://localhost:3003';
}

const SETTINGS = new Settings();

export default SETTINGS;
