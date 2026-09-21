import { DataSource } from 'typeorm';
import SETTINGS from './settings';

// DataSource — это объект TypeORM, который знает, как подключиться к базе данных,
// и через который получают репозитории (dataSource.getRepository(Restaurant) и т.п.).
// Его нужно один раз "инициализировать" (открыть соединение) при старте сервера — см. app.ts.
const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [SETTINGS.DB_ENTITIES], // где искать файлы моделей (src/models/*.entity.ts)
    subscribers: [SETTINGS.DB_SUBSCRIBERS], // где искать файлы-подписчики (src/models/*.subscriber.ts)
    logging: true, // печатать в консоль все SQL-запросы — удобно для отладки
    synchronize: true, // автоматически создавать/менять таблицы по моделям при каждом старте.
    // Для учебного проекта это нормально: не нужно писать миграции вручную.
    // В реальном проекте так делать нельзя — можно случайно потерять данные.
});

export default dataSource;
