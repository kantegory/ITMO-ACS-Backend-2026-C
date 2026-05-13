import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';
import path from 'path';

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
      userAuth: 'http://localhost:8001',
      recipe: 'http://localhost:8002',
      engagement: 'http://localhost:8003'
    }
  });
});


app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/auth/',
  },
}));

app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/users/',
  },
}));

app.use('/api/recipes/:id/like', createProxyMiddleware({
  target: 'http://localhost:8003',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/recipes/:id/like/',
  },
}));

app.use('/api/recipes/:id/comments', createProxyMiddleware({
  target: 'http://localhost:8003',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/recipes/:id/comments/',
  },
}));

app.use('/api/comments/:id', createProxyMiddleware({
  target: 'http://localhost:8003',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/comments/:id/',
  },
}));

app.use('/api/recipes', createProxyMiddleware({
  target: 'http://localhost:8002',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/recipes/',
  },
}));

app.use('/api/search', createProxyMiddleware({
  target: 'http://localhost:8002',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/search/',
  },
}));

app.listen(PORT, () => {
  console.log(`\nAPI Gateway running on http://localhost:${PORT}`);
});