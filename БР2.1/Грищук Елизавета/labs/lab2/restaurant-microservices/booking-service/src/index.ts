import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import bookingRouter from './booking.router';
import { connectRabbitMQ } from './rabbitmq';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/bookings', bookingRouter);

const PORT = process.env.PORT || 3003;

AppDataSource.initialize()
    .then(async () => {
        console.log('booking-service: Database connected');
        await connectRabbitMQ();
        app.listen(PORT, () => {
            console.log(`booking-service running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1);
    });