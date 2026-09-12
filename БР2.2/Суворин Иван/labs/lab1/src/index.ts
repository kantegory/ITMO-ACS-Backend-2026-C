import 'reflect-metadata';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { AppDataSource } from './config/data-source';
import { config } from './config/config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('📦 База данных подключена');

  const app = express();

  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // Swagger UI — отдаём актуальную openapi.yaml (нефункц. требование "Swagger" из ДЗ2)
  const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
  const openapiDocument = yaml.load(fs.readFileSync(openapiPath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument as object));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${config.port}`);
    console.log(`📖 Swagger UI:     http://localhost:${config.port}/api-docs`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Не удалось запустить приложение:', err);
  process.exit(1);
});
