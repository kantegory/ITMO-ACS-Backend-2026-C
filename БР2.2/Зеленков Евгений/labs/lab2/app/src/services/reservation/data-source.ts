import { config } from '../../shared/config';
import { OutboxEvent } from '../../shared/events';
import { createDataSource } from '../../shared/typeorm';
import { reservationEntities } from './entities';

export const ReservationDataSource = createDataSource(config.databases.reservation, [...reservationEntities, OutboxEvent]);
