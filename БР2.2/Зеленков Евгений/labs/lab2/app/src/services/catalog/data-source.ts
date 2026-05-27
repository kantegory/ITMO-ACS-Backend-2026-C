import { config } from '../../shared/config';
import { createDataSource } from '../../shared/typeorm';
import { catalogEntities } from './entities';

export const CatalogDataSource = createDataSource(config.databases.catalog, catalogEntities);
