import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { ReviewDataSource } from './data-source';
import { closeReviewPublisher, reviewRouter } from './routes';

async function bootstrap() {
  await ReviewDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', reviewRouter);
  mountErrorHandlers(app);
  const server = app.listen(config.ports.review, () => {
    console.log(`review-service listening on http://localhost:${config.ports.review}`);
  });

  async function shutdown() {
    server.close();
    await closeReviewPublisher();
    await ReviewDataSource.destroy();
    process.exit(0);
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
