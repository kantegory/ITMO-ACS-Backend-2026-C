import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { AppDataSource } from './config/database';
import authRouter from './controllers/AuthController';
import userRouter from './controllers/UserController';
import categoryRouter from './controllers/CategoryController';
import restaurantRouter from './controllers/RestaurantController';
import bookingRouter from './controllers/BookingController';

dotenv.config();

const app = express();
app.use(express.json());

// Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/bookings', bookingRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
