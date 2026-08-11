import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Глобальный таймаут для всех запросов
app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// Swagger документация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real Estate Microservices API',
      version: '1.0.0',
      description: 'API Gateway for Real Estate Microservices',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    timeout: 120000,
  },
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'OK', timestamp: new Date().toISOString() });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    service: 'Real Estate API Gateway',
    version: '1.0.0',
    documentation: '/api-docs',
    services: {
      users: '/api/v1/users',
      estates: '/api/v1/estates',
      deals: '/api/v1/deals',
      sessions: '/api/v1/sessions',
      messages: '/api/v1/messages',
    },
  });
});

// Прокси для User Service
app.use('/api/v1/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
  proxyTimeout: 120000,
  timeout: 120000,
  followRedirects: true,
  agent: new http.Agent({ keepAlive: true }),
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] → User Service: ${req.method} ${req.url}`);
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('X-Forwarded-For', req.ip || '');
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Proxy Error:', err);
    res.status(500).json({
      statusCode: 500,
      error: {
        code: 'PROXY_ERROR',
        message: err.message,
      },
    });
  },
}));

// Прокси для Estate Service
app.use('/api/v1/estates', createProxyMiddleware({
  target: 'http://estate-service:3002',
  changeOrigin: true,
  proxyTimeout: 120000,
  timeout: 120000,
  followRedirects: true,
  agent: new http.Agent({ keepAlive: true }),
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] → Estate Service: ${req.method} ${req.url}`);
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error' });
  },
}));

// Прокси для Deal Service
app.use('/api/v1/deals', createProxyMiddleware({
  target: 'http://deal-service:3003',
  changeOrigin: true,
  proxyTimeout: 120000,
  timeout: 120000,
  followRedirects: true,
  agent: new http.Agent({ keepAlive: true }),
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] → Deal Service: ${req.method} ${req.url}`);
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error' });
  },
}));

// Прокси для Sessions
app.use('/api/v1/sessions', createProxyMiddleware({
  target: 'http://messaging-service:3004',
  changeOrigin: true,
  proxyTimeout: 120000,
  timeout: 120000,
  followRedirects: true,
  agent: new http.Agent({ keepAlive: true }),
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] → Messaging Service: ${req.method} ${req.url}`);
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error' });
  },
}));

// Прокси для Messages
app.use('/api/v1/messages', createProxyMiddleware({
  target: 'http://messaging-service:3004',
  changeOrigin: true,
  proxyTimeout: 120000,
  timeout: 120000,
  followRedirects: true,
  agent: new http.Agent({ keepAlive: true }),
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] → Messaging Service: ${req.method} ${req.url}`);
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error' });
  },
}));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    statusCode: 500,
    error: { code: 'GATEWAY_ERROR', message: 'API Gateway error' }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`📋 API root: http://localhost:${PORT}/`);
});