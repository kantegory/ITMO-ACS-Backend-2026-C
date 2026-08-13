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
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'deal-service',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/v1/deals', routes);

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
        console.log('Deal Service Data Source initialized!');

        await connectRabbitMQ();
        console.log('Deal Service connected to RabbitMQ');

        const consumer = EventConsumer.getInstance();

        consumer.registerHandler('user.created', async (payload) => {
            console.log('Received user.created event:', payload.data);
        });

        consumer.registerHandler('estate.created', async (payload) => {
            console.log('Received estate.created event:', payload.data);
        });

        await consumer.startConsuming('deal-service');

        app.listen(PORT, () => {
            console.log(`Deal Service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start Deal Service:', error);
        process.exit(1);
    }
};

startServer();

export default app;
