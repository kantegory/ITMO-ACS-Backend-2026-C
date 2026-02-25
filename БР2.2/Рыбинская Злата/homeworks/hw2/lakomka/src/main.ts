import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as yaml from 'yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const file = fs.readFileSync('./src/docs/openapi.yaml', 'utf8');
  const document = yaml.parse(file);

  app.use('/api', swaggerUi.serve, swaggerUi.setup(document));

  await app.listen(3000);
}
bootstrap();
