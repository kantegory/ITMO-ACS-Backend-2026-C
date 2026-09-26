import 'reflect-metadata'; // нужно для декораторов TypeORM и routing-controllers

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware';

import BookingController from './controllers/booking.controller';
import AvailabilityController from './controllers/availability.controller';
import MyBookingsController from './controllers/my-bookings.controller';
import InternalBookingController from './controllers/internal-booking.controller';

class App {
    public port: number;
    public host: string;
    public protocol: string;

    private app: express.Application;

    constructor(
        port = SETTINGS.APP_PORT,
        host = SETTINGS.APP_HOST,
        protocol = SETTINGS.APP_PROTOCOL,
    ) {
        this.port = port;
        this.host = host;
        this.protocol = protocol;

        this.app = this.configureApp();
    }

    private configureApp(): express.Application {
        let app = express();

        app.use(cors());
        app.use(express.json());

        const commonOptions = {
            middlewares: [ErrorHandlerMiddleware],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: false,
        };

        // Публичный API — под общим префиксом /api/v1 (уходит через gateway).
        app = useExpressServer(app, {
            ...commonOptions,
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [BookingController, AvailabilityController, MyBookingsController],
        });

        // Внутренний API — без префикса, пути начинаются прямо с /internal
        // (docs/openapi-internal.yaml), gateway их не публикует.
        app = useExpressServer(app, {
            ...commonOptions,
            controllers: [InternalBookingController],
        });

        return app;
    }

    public start(): void {
        dataSource
            .initialize()
            .then(() => {
                console.log('Data Source has been initialized!');
            })
            .catch((err) => {
                console.error('Error during Data Source initialization:', err);
            });

        this.app.listen(this.port, this.host, () => {
            console.log(
                `bookings-service running on ${this.protocol}://${this.host}:${this.port}`,
            );
        });
    }
}

const app = new App();
app.start();

export default app;
