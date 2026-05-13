import { createApp } from './app';
import { config } from './config';
import { AppDataSource } from './data-source';

async function bootstrap() {
  await AppDataSource.initialize();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Booking API is running on http://localhost:${config.port}/api/v1`);
    console.log(`Swagger UI is available on http://localhost:${config.port}/docs`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
