import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { IdentityDataSource } from './data-source';
import { identityRouter } from './routes';

async function bootstrap() {
  await IdentityDataSource.initialize();
  const app = createServiceApp();
  app.use('/api/v1', identityRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.identity, () => {
    console.log(`identity-service listening on http://localhost:${config.ports.identity}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
