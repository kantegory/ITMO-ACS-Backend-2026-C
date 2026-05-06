import { defaultMetadataStorage } from "class-transformer/cjs/storage";
import { Express } from "express";
import { getMetadataArgsStorage, RoutingControllersOptions } from "routing-controllers";
import { routingControllersToSpec } from "routing-controllers-openapi";
import * as swaggerUi from "swagger-ui-express";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";

export function useSwagger(app: Express, options: RoutingControllersOptions): Express {
  const schemas = validationMetadatasToSchemas({
    classTransformerMetadataStorage: defaultMetadataStorage,
    refPointerPrefix: "#/components/schemas/"
  });
  const storage = getMetadataArgsStorage();
  const spec = routingControllersToSpec(storage, options, {
    info: { title: "Reviews Service API", version: "1.0.0" },
    components: {
      schemas,
      securitySchemes: {
        internalApiKey: { type: "apiKey", in: "header", name: "X-Internal-Api-Key" }
      }
    }
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
  app.get("/openapi.json", (_req, res) => res.json(spec));
  return app;
}
export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Reviews Service API",
    version: "1.0.0"
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/v1/reviews": { post: { summary: "Create review" } },
    "/api/v1/reviews/{id}": {
      patch: { summary: "Update review" },
      delete: { summary: "Delete review" }
    }
  }
};
