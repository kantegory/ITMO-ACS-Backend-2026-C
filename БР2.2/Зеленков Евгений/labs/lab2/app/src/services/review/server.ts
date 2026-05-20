import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { ReviewDataSource } from './data-source';
import { reviewRouter } from './routes';

async function bootstrap() {
  await ReviewDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', reviewRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.review, () => {
    console.log(`review-service listening on http://localhost:${config.ports.review}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
