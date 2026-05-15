import { env } from 'process';

class Settings {
    SERVICE_NAME = env.SERVICE_NAME || 'message';
    PORT = Number(env.PORT) || 8005;

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = Number(env.DB_PORT) || 15432;
    DB_NAME = env.DB_NAME || 'messagedb';
    DB_USER = env.DB_USER || 'messagedb';
    DB_PASSWORD = env.DB_PASSWORD || 'messagedb';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.js';
    ENABLE_DB = env.ENABLE_DB === 'true';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'service-token';  

    KAFKA_BROKERS = env.KAFKA_BROKERS || 'kafka:9092';
    KAFKA_TOPIC = env.KAFKA_TOPIC || 'message.events';

    USER_URL = env.USER_URL
}
export default new Settings();
