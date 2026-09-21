import 'reflect-metadata'; // нужно для декораторов TypeORM и routing-controllers — без этого не будет работать @Entity, @Column и т.п.

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import CityController from './controllers/city.controller';
import CuisineController from './controllers/cuisine.controller';
import RestaurantController from './controllers/restaurant.controller';
import RestaurantAdminController from './controllers/restaurant-admin.controller';
import RestaurantPhotoController from './controllers/restaurant-photo.controller';
import MenuItemController from './controllers/menu-item.controller';
import RestaurantTableController from './controllers/restaurant-table.controller';
import TimeSlotController from './controllers/time-slot.controller';
import AvailabilityController from './controllers/availability.controller';
import BookingController from './controllers/booking.controller';
import ReviewController from './controllers/review.controller';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware';

// Главный класс приложения. Он один раз при старте:
// 1) создаёт Express-приложение,
// 2) подключает к нему все контроллеры через routing-controllers,
// 3) подключает документацию Swagger,
// 4) открывает соединение с базой данных,
// 5) запускает сервер слушать порт.
class App {
    public port: number;
    public host: string;
    public protocol: string;
    public controllersPath: string;

    private app: express.Application;

    constructor(
        port = SETTINGS.APP_PORT,
        host = SETTINGS.APP_HOST,
        protocol = SETTINGS.APP_PROTOCOL,
        controllersPath = SETTINGS.APP_CONTROLLERS_PATH,
    ) {
        this.port = port;
        this.host = host;
        this.protocol = protocol;

        this.controllersPath = controllersPath;

        this.app = this.configureApp();
    }

    private configureApp(): express.Application {
        let app = express();

        // middlewares section
        app.use(cors()); // разрешает запросы с других доменов (например, из Postman или фронтенда)
        app.use(express.json()); // разбирает JSON-тело запроса в req.body

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX, // все маршруты будут начинаться с /api/v1
            // controllers: [__dirname + this.controllersPath], // автоподключение по маске файлов — не используется,
            // контроллеры подключаются вручную ниже, чтобы явно видеть весь список
            controllers: [
                AuthController,
                UserController,
                CityController,
                CuisineController,
                RestaurantController,
                RestaurantAdminController,
                RestaurantPhotoController,
                MenuItemController,
                RestaurantTableController,
                TimeSlotController,
                AvailabilityController,
                BookingController,
                ReviewController,
            ],
            middlewares: [ErrorHandlerMiddleware], // ловит все ошибки из контроллеров и приводит к единому формату
            validation: true, // включает проверку тел запросов через class-validator (декораторы @IsString и т.п.)
            classTransformer: true, // превращает обычный JSON в экземпляр нужного DTO-класса
            defaultErrorHandler: false, // отключаем встроенный обработчик ошибок — используем свой (ErrorHandlerMiddleware)
        };

        app = useExpressServer(app, options); // регистрирует все маршруты контроллеров в Express
        app = useSwagger(app, options); // добавляет страницу документации /docs

        return app;
    }

    public start(): void {
        // establish database connection
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
                `Running server on ${this.protocol}://${this.host}:${this.port}`,
            );
        });
    }
}

const app = new App();
app.start();

export default app;
