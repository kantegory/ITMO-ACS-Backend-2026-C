import "reflect-metadata";
import express from "express";
import { useExpressServer } from "routing-controllers";
import { config } from "./config";
import { dataSource } from "./data-source";
import { ReviewsController } from "./controllers/reviews.controller";
import { useSwagger } from "./swagger";

async function bootstrap() {
  await dataSource.initialize();

  let app = express();
  const options = {
    controllers: [ReviewsController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true
  };
  app = useExpressServer(app, options);
  app = useSwagger(app, options);
  app.listen(config.port, () => console.log(`reviews-service listening on ${config.port}`));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
