import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'js-yaml';
import fs from 'fs';
import redoc from 'redoc-express';

const app = express();
const PORT = process.env.PORT || 8000;

// Загружаем сгенерированную OpenAPI схему
const swaggerDocument = YAML.load(
  fs.readFileSync('./tsp-output/schema/openapi.yaml', 'utf8')
);

// ReDoc документация
app.get('/docs/redoc', redoc({
  title: 'Property Rental API - ReDoc',
  specUrl: '/docs/openapi.yaml'
}));

// OpenAPI YAML файл для скачивания
app.get('/docs/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile('./tsp-output/schema/openapi.yaml', { root: process.cwd() });
});

// OpenAPI JSON
app.get('/docs/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Property Rental API - Swagger UI'
}));

// Редирект с корня на документацию
app.get('/', (req, res) => {
  res.redirect('/docs');
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Property Rental API - Documentation Server             ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Swagger UI:  http://localhost:${PORT}/docs                   ║
║  ReDoc:       http://localhost:${PORT}/docs/redoc             ║
║  OpenAPI:     http://localhost:${PORT}/docs/openapi.yaml      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
