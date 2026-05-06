import "reflect-metadata";
import express from "express";
import { useExpressServer } from "routing-controllers";
import { config } from "./config";
import { dataSource } from "./data-source";
import { MenuItemEntity } from "./entities/menu-item.entity";
import { RestaurantEntity } from "./entities/restaurant.entity";
import { publish, startReviewEventsConsumer } from "./kafka";
import { RestaurantsRepository } from "./repositories/restaurants.repository";
import { RestaurantsService } from "./services/restaurants.service";
import { RestaurantsController } from "./controllers/restaurants.controller";
import { useSwagger } from "./swagger";

async function bootstrap() {
  await dataSource.initialize();
  const restaurantsRepository = new RestaurantsRepository(
    dataSource.getRepository(RestaurantEntity),
    dataSource.getRepository(MenuItemEntity)
  );
  const restaurantsService = new RestaurantsService(restaurantsRepository, publish);
  startReviewEventsConsumer(async (restaurantId) => {
    await restaurantsService.recalculateRatingFromReviews(restaurantId);
  });

  let app = express();
  const options = {
    controllers: [RestaurantsController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true
  };
  app = useExpressServer(app, options);
  app = useSwagger(app, options);

  app.listen(config.port, () => console.log(`restaurant-service listening on ${config.port}`));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
