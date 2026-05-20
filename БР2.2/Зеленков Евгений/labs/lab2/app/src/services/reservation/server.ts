import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { ReservationDataSource } from './data-source';
import { closeReservationPublisher, reservationRouter } from './routes';

async function bootstrap() {
  await ReservationDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', reservationRouter);
  mountErrorHandlers(app);
  const server = app.listen(config.ports.reservation, () => {
    console.log(`reservation-service listening on http://localhost:${config.ports.reservation}`);
  });

  async function shutdown() {
    server.close();
    await closeReservationPublisher();
    await ReservationDataSource.destroy();
    process.exit(0);
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
