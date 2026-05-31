import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const USER_AUTH_SERVICE_URL = process.env.USER_AUTH_SERVICE_URL || 'http://user:8001';

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || 'http://recipe:8002';

const ENGAGEMENT_SERVICE_URL = process.env.ENGAGEMENT_SERVICE_URL || 'http://engagement:8003';

const app = express();
const PORT = 8000;

app.use(cors());

let swaggerDocument: any;
try {
  const openapiPath = path.join(__dirname, 'openapi.yaml');
  swaggerDocument = YAML.load(openapiPath);
} catch (error) {
  swaggerDocument = {
    openapi: '3.0.0',
    info: { title: 'Recipe API', version: '1.0.0' },
    paths: {},
  };
}

app.use((req, res, next) => {
  console.log(
    `[GATEWAY] ${req.method} ${req.originalUrl}`
  );
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Recipe API - Swagger UI',
}));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    gateway: 'running',
    services: {
      userAuth: USER_AUTH_SERVICE_URL,
      recipe: RECIPE_SERVICE_URL,
      engagement: ENGAGEMENT_SERVICE_URL
    }
  });
});

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.use('/api/auth', createProxyMiddleware({
  target: USER_AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/auth/',
  },
}));

app.use('/api/users', createProxyMiddleware({
  target: USER_AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/users/',
  },
}));

const engagementProxy = createProxyMiddleware({
  target: ENGAGEMENT_SERVICE_URL,
  changeOrigin: true,
});

app.use('/api/recipes/:id/react', (req, res, next) => {
  req.url = `/api/recipes/${req.params.id}/react`;
  engagementProxy(req, res, next);
});

app.use('/api/recipes/:id/save', (req, res, next) => {
  req.url = `/api/recipes/${req.params.id}/save`;
  engagementProxy(req, res, next);
});

app.use('/api/recipes/:id/comments', (req, res, next) => {
  req.url = `/api/recipes/${req.params.id}/comments`;
  engagementProxy(req, res, next);
});

app.use('/api/comments/:id', (req, res, next) => {
  req.url = `/api/comments/${req.params.id}`;
  engagementProxy(req, res, next);
});

app.use('/api/recipes', createProxyMiddleware({
  target: RECIPE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/recipes/',
  },
}));

app.use('/api/search', createProxyMiddleware({
  target: RECIPE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/search/',
  },
}));

app.listen(PORT, () => {
  console.log(`\nAPI Gateway running on http://localhost:${PORT}`);
});