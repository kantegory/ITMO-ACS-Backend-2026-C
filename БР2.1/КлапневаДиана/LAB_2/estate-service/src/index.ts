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
const PORT = process.env.PORT || 3002;


app.use(helmet());
app.use(cors());
app.use(express.json());




app.get('/health', (req, res) => {
  res.json({
    service: 'estate-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});


app.use('/api/v1/estates', routes);


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    statusCode: 500,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong!' }
  });
});


const startServer = async () => {
  try {

    await AppDataSource.initialize();
    console.log('Estate Service запущен');


    await connectRabbitMQ();
    console.log('Estate Service подключен к RabbitMQ');

    const consumer = EventConsumer.getInstance();

    // подписываемся на событие изменения статуса сделки
    consumer.registerHandler('deal.status.changed', async (payload) => {
      console.log('Received deal.status.changed event:', payload.data);
      
      // Здесь можно обновить статус is_available у объекта недвижимости
      // Например, если сделка стала активной, помечаем объект как недоступный
      const { dealId, estateIds, newStatus } = payload.data;
      
      if (newStatus === 'active') {
        // Обновляем is_available = false для всех estateIds
        console.log(`🔒 Marking estates ${estateIds.join(', ')} as unavailable`);
        // Здесь будет логика обновления в базе данных
      }
    });

    // Запускаем потребление сообщений
    await consumer.startConsuming('estate-service');


    app.listen(PORT, () => {
      console.log(`Estate Service  http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('ошибка Estate Service:', error);
    process.exit(1);
  }
};

startServer();

export default app;