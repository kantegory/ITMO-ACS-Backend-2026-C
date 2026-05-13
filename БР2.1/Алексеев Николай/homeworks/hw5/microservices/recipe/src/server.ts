import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import recipeRoutes from './routes/recipe.routes';
import { connectRabbitMQ } from './rabbitmq/connection';
import { startRecipeConsumer } from './rabbitmq/consumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


app.use('/api/recipes', recipeRoutes);
app.use('/api/search', recipeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'recipe-service' });
});

AppDataSource.initialize()
  .then(async () => {
    await connectRabbitMQ();
    await startRecipeConsumer();
    console.log(`Recipe Service running on port ${PORT}`);
    app.listen(PORT);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });