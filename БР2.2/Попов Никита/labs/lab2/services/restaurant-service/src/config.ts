export const config = {
  port: Number(process.env.PORT ?? 8082),
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: Number(process.env.DB_PORT ?? 15441),
  dbName: process.env.DB_NAME ?? "app_db",
  dbUser: process.env.DB_USER ?? "app",
  dbPassword: process.env.DB_PASSWORD ?? "app",
  dbSchema: process.env.DB_SCHEMA ?? "restaurants",
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "internal-secret",
  reviewsServiceUrl: process.env.REVIEWS_SERVICE_URL ?? "http://localhost:8084"
};

console.log("KAFKA_BROKERS =", process.env.KAFKA_BROKERS);
console.log("config.kafkaBrokers =", config.kafkaBrokers);
