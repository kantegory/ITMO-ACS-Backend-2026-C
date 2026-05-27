import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { CatalogDataSource } from './data-source';
import { catalogRouter } from './routes';

async function bootstrap() {
  await CatalogDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', catalogRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.catalog, () => {
    console.log(`restaurant-catalog-service listening on http://localhost:${config.ports.catalog}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
