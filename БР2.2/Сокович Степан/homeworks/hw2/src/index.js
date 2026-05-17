const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { openApiSpec } = require("./openapi");
const { router } = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "API сервиса аренды жилья",
    docs: `http://localhost:${PORT}/api-docs`,
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Документация API аренды жилья",
    swaggerOptions: {
      docExpansion: "list",
      defaultModelsExpandDepth: 2,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info hgroup.main h2 { font-size: 34px; }
      .swagger-ui .scheme-container { box-shadow: none; }
    `,
  })
);

app.use("/", router);

app.use((req, res) => {
  res.status(404).json({ message: "Не найдено" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger-документация: http://localhost:${PORT}/api-docs`);
});

