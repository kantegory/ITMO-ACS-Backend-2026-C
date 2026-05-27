import { config } from '../../shared/config';
import { createDataSource } from '../../shared/typeorm';
import { identityEntities } from './entities';

export const IdentityDataSource = createDataSource(config.databases.identity, identityEntities);
