import { env } from 'process';

// Все настройки приложения собраны в одном месте. Каждое поле читает значение
// из переменной окружения (.env), а если её нет — берёт значение по умолчанию.
// Остальной код никогда не читает process.env напрямую — только SETTINGS.что-то,
// это удобно: настройки видно все сразу, и их легко поменять в одном файле.
class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8000;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_CONTROLLERS_PATH: string =
        env.APP_CONTROLLERS_PATH || '/controllers/*.controller.js';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api'; // в .env задано /api/v1, как требует спецификация

    // db connection settings
    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 15432;
    DB_NAME = env.DB_NAME || 'maindb';
    DB_USER = env.DB_USER || 'maindb';
    DB_PASSWORD = env.DB_PASSWORD || 'maindb';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.entity.js'; // шаблон пути к файлам моделей
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'dist/models/*.subscriber.js';

    // jwt settings
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret'; // секрет для подписи токена — задан в .env своим значением
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer'; // тип токена, который пишем в ответе (access_token, token_type)
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5; // сколько секунд живёт токен после выдачи
}

const SETTINGS = new Settings(); // создаём один-единственный экземпляр — вроде глобальной переменной

export default SETTINGS;
