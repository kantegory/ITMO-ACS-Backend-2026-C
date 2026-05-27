import { createServiceApp, mountErrorHandlers } from '../../shared/app';
import { config } from '../../shared/config';
import { gatewayRouter } from './routes';

async function bootstrap() {
  const app = createServiceApp();
  app.use('/api/v1', gatewayRouter);
  mountErrorHandlers(app);
  app.listen(config.ports.gateway, () => {
    console.log(`api-gateway listening on http://localhost:${config.ports.gateway}/api/v1`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
