import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { connectRabbitMQ } from './rabbitmq/connection';
import { startUserServiceConsumer } from './rabbitmq/consumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-auth-service' });
});

AppDataSource.initialize()
  .then(async () => {
    await connectRabbitMQ();
    await startUserServiceConsumer();
    console.log(`User Service running on port ${PORT}`);
    app.listen(PORT);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });