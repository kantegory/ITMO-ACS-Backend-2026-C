import express from "express";
import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Разрешает серверу читать JSON из тела запроса.
app.use(express.json());

// Все API-маршруты начинаются с /api.
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({
    message: "API is running",
  });
});

app.use(errorMiddleware);

export default app;
