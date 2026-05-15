import { DataSource } from 'typeorm';
import settings from './config';
import 'reflect-metadata';


const userDataSource = new DataSource({
    type: 'postgres',
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    username: settings.DB_USER,
    password: settings.DB_PASSWORD,
    database: settings.DB_NAME,
    entities: [settings.DB_ENTITIES],
    subscribers: [settings.DB_SUBSCRIBERS],
    synchronize: true,
    logging: true,
});

export default userDataSource;
