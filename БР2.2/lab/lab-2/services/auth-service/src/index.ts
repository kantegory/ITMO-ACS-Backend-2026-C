import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './config/data-source';
import { config } from './config/config';
import routes from './routes';
import internalRoutes from './routes/internalRoutes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('[auth-service] База данных подключена');

  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // Публичные маршруты — их вызывает Gateway от имени клиента
  app.use('/api', routes);

  // Внутренние маршруты — их вызывают только другие сервисы (Recipe/Social),
  // никогда не пробрасываются наружу через Gateway
  app.use('/internal', internalRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`[auth-service] Запущен: http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[auth-service] Не удалось запустить:', err);
  process.exit(1);
});
