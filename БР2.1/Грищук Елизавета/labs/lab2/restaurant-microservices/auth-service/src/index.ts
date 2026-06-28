import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import authRouter from './auth.router';
import internalRouter from './internal.router';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', authRouter);
app.use('/internal', internalRouter);

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
    .then(() => {
        console.log('auth-service: Database connected');
        app.listen(PORT, () => {
            console.log(`auth-service running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1);
    });