import { config } from '../../shared/config';
import { OutboxEvent } from '../../shared/events';
import { createDataSource } from '../../shared/typeorm';
import { reviewEntities } from './entities';

export const ReviewDataSource = createDataSource(config.databases.review, [...reviewEntities, OutboxEvent]);
