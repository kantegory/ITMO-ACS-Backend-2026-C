import { DataSource } from 'typeorm';
import SETTINGS from './settings';

const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: 'database.sqlite',
    entities: [SETTINGS.DB_ENTITIES],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
