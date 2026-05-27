import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'node:fs';
import path from 'node:path';
import { router } from './routes';
import { config } from './config';
import { HttpError, sendError } from './http';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
  app.use(express.json());
  app.use(morgan('dev'));//зачем он тут...

  const openApiPath = path.resolve(__dirname, '../docs/openapi.yaml');
  if (fs.existsSync(openApiPath)) {
    const document = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
  }

  app.use('/api/v1', router);

  app.use((_req, _res, next) => {
    next(new HttpError(404, 'route_not_found', 'Route not found'));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    sendError(res, error);
  });

  return app;
}
