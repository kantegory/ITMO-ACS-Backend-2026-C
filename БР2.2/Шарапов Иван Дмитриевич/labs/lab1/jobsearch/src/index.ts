import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log("✅ Подключение к базе данных установлено");

    const app = createApp();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`📚 Swagger: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Ошибка запуска приложения:", error);
    process.exit(1);
  }
}

bootstrap();
