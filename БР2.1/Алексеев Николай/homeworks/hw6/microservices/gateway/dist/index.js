"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const USER_AUTH_SERVICE_URL = process.env.USER_AUTH_SERVICE_URL || 'http://user:8001';
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || 'http://recipe:8002';
const ENGAGEMENT_SERVICE_URL = process.env.ENGAGEMENT_SERVICE_URL || 'http://engagement:8003';
const app = (0, express_1.default)();
const PORT = 8000;
app.use((0, cors_1.default)());
let swaggerDocument;
try {
    const openapiPath = path_1.default.join(__dirname, 'openapi.yaml');
    swaggerDocument = yamljs_1.default.load(openapiPath);
}
catch (error) {
    swaggerDocument = {
        openapi: '3.0.0',
        info: { title: 'Recipe API', version: '1.0.0' },
        paths: {},
    };
}
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.originalUrl}`);
    next();
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
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
app.use('/api/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: USER_AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/auth/',
    },
}));
app.use('/api/users', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: USER_AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/users/',
    },
}));
const engagementProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
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
app.use('/api/recipes', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: RECIPE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/recipes/',
    },
}));
app.use('/api/search', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: RECIPE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/search/',
    },
}));
app.listen(PORT, () => {
    console.log(`\nAPI Gateway running on http://localhost:${PORT}`);
});
