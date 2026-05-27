import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { ReservationDataSource } from './data-source';
import { reservationRouter } from './routes';

async function bootstrap() {
  await ReservationDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', reservationRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.reservation, () => {
    console.log(`reservation-service listening on http://localhost:${config.ports.reservation}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
