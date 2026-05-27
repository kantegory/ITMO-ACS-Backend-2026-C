import { config } from '../../shared/config';
import { createDataSource } from '../../shared/typeorm';
import { menuEntities } from './entities';

export const MenuDataSource = createDataSource(config.databases.menu, menuEntities);
