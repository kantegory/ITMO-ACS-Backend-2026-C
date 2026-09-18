import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { ServerResponse } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config/config';

const app = express();
app.use(cors());
app.use(morgan('dev'));

// ВАЖНО: здесь намеренно НЕТ express.json(). Gateway ничего не делает с телом
// запроса сам — если бы он его распарсил, http-proxy-middleware переслал бы
// нижестоящему сервису уже "пустой" поток. Разбором тела занимается тот сервис,
// который реально обрабатывает запрос (у него есть свой express.json()).

// Общий фабричный метод: один и тот же обработчик ошибок для всех трёх сервисов —
// если сервис не запущен/недоступен, клиент получит понятный JSON, а не зависший запрос
function proxyTo(target: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      error: (err, _req, res) => {
        console.error(`Не удалось достучаться до ${target}:`, err.message);
        const response = res as ServerResponse;
        if (!response.headersSent) {
          response.writeHead(502, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ message: 'Сервис временно недоступен, попробуйте позже' }));
        }
      },
    },
  });
}

const authProxy = proxyTo(config.authServiceUrl);
const recipeProxy = proxyTo(config.recipeServiceUrl);
const socialProxy = proxyTo(config.socialServiceUrl);

// Swagger UI — тот же внешний контракт (openapi.yaml), что был в монолите ЛР1.
// Для клиента снаружи вообще ничего не изменилось: адрес /api-docs тот же.
try {
  const openapiPath = path.join(__dirname, '..', '..', '..', 'openapi.yaml');
  const openapiDocument = yaml.load(fs.readFileSync(openapiPath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument as object));
} catch (err) {
  console.error('Не удалось загрузить openapi.yaml для Swagger UI:', (err as Error).message);
}

// ПОРЯДОК МАРШРУТОВ ВАЖЕН: более узкие/специфичные пути регистрируются
// раньше общих, иначе общий маршрут "перехватит" запрос первым.
// Например /api/recipes/:id/like должен быть проверен раньше общего /api/recipes.

// users/me — три разных сервиса на одном префиксе, поэтому порядок здесь особенно важен
app.use('/api/users/me/recipes', recipeProxy);
app.use('/api/users/me/favorites', socialProxy);
app.use('/api/users/me', authProxy);

app.use('/api/auth', authProxy);

// recipes/:id/like и .../favorite — раньше общего /api/recipes
app.use('/api/recipes/:id/like', socialProxy);
app.use('/api/recipes/:id/favorite', socialProxy);
app.use('/api/recipes', recipeProxy);

// admin — свои префиксы, порядок между ними не важен
app.use('/api/admin/recipes', recipeProxy);
app.use('/api/admin/comments', socialProxy);

app.use('/api/comments', socialProxy);
app.use('/api/ingredients', recipeProxy);
app.use('/api/units', recipeProxy);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.listen(config.port, () => {
  console.log(`[gateway] Запущен: http://localhost:${config.port}`);
  console.log(`[gateway] Swagger UI: http://localhost:${config.port}/api-docs`);
  console.log(`auth:    ${config.authServiceUrl}`);
  console.log(`recipe:  ${config.recipeServiceUrl}`);
  console.log(`social:  ${config.socialServiceUrl}`);
});
