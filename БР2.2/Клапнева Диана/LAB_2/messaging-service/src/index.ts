import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import routes from './routes';

import { connectRabbitMQ } from './rabbitmq/connection';
import { EventPublisher } from './rabbitmq/publisher';
import { EventConsumer } from './rabbitmq/consumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());



// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'messaging-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/sessions', routes);
app.use('/api/v1/messages', routes);

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
    // 1. Подключение к базе данных
    await AppDataSource.initialize();
    console.log('Messaging Service запущен');

    // 2. Подключение к RabbitMQ
    await connectRabbitMQ();
    console.log('Messaging Service подключен к RabbitMQ');

    // 3. Настройка Consumer (подписка на события)
    const consumer = EventConsumer.getInstance();

    // Подписываемся на событие создания пользователя
    consumer.registerHandler('user.created', async (payload) => {
      console.log('Received user.created event:', payload.data);
      // Здесь создаем сессию (чат) для нового пользователя
      // const { userId } = payload.data;
      // await createSessionForUser(userId);
    });

    // Подписываемся на событие изменения статуса сделки
    consumer.registerHandler('deal.status.changed', async (payload) => {
      console.log('Received deal.status.changed event:', payload.data);
      // Здесь можно отправить уведомление участникам сделки
      // const { dealId, newStatus } = payload.data;
      // await notifyDealParticipants(dealId, newStatus);
    });

    // Запускаем потребление сообщений
    await consumer.startConsuming('messaging-service');

    // 4. Запуск сервера
    app.listen(PORT, () => {
      console.log(`Messaging Service  http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('ошибка Messaging Service:', error);
    process.exit(1);
  }
};

startServer();

export default app;