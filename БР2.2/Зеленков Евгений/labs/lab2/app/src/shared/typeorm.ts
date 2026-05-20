import 'reflect-metadata';
import { DataSource, EntitySchema } from 'typeorm';
import { config } from './config';

export function createDataSource(databaseUrl: string, entities: (Function | EntitySchema)[]) {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    synchronize: config.databaseSynchronize,
    logging: false,
    entities
  });
}
