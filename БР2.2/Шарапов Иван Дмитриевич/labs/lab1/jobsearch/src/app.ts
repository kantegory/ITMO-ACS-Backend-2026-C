import express, { Application } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import routes from "./routes";
import { errorHandler } from "./middleware/error";

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api", routes);

  // Swagger UI из openapi.yaml (если файл присутствует)
  const openapiPath = path.join(__dirname, "..", "openapi.yaml");
  if (fs.existsSync(openapiPath)) {
    const swaggerDocument = YAML.load(openapiPath);
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  app.use(errorHandler);

  return app;
}
