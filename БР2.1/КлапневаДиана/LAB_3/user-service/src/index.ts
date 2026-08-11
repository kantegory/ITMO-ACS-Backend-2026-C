import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import routes from './routes';
import { connectRabbitMQ } from './rabbitmq/connection';
import { EventConsumer } from './rabbitmq/consumer';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10); // ← ИСПРАВЛЕНО

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Глобальный таймаут для всех запросов
app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// Логирование запросов
app.use((req, res, next) => {
  console.log(`📥 [User Service] ${req.method} ${req.url} received`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/users', routes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    statusCode: 500,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong!' }
  });
});

// Инициализация
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ User Service Data Source initialized!');

    await connectRabbitMQ();
    console.log('✅ User Service connected to RabbitMQ');

    const consumer = EventConsumer.getInstance();
    consumer.registerHandler('user.created', async (payload) => {
      console.log('📩 Received user.created event:', payload.data);
    });
    await consumer.startConsuming('user-service');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 User Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start User Service:', error);
    process.exit(1);
  }
};

startServer();

export default app;