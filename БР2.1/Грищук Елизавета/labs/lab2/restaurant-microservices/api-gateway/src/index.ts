import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:3004';

app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
}));

app.use('/api/users', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
}));

app.use('/api/categories', createProxyMiddleware({
    target: RESTAURANT_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
}));

app.use('/api/restaurants', createProxyMiddleware({
    target: RESTAURANT_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
}));

app.use('/api/bookings', createProxyMiddleware({
    target: BOOKING_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
}));

app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`api-gateway running on http://localhost:${PORT}`);
});