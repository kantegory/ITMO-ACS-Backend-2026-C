import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { MenuDataSource } from './data-source';
import { menuRouter } from './routes';

async function bootstrap() {
  await MenuDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', menuRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.menu, () => {
    console.log(`menu-service listening on http://localhost:${config.ports.menu}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
