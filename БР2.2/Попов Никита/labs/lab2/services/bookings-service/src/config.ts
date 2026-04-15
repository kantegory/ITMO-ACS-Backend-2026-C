export const config = {
  port: Number(process.env.PORT ?? 8083),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "internal-secret",
  userServiceUrl: process.env.USER_SERVICE_URL ?? "http://localhost:8081",
  restaurantServiceUrl: process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:8082",
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: Number(process.env.DB_PORT ?? 15441),
  dbName: process.env.DB_NAME ?? "app_db",
  dbUser: process.env.DB_USER ?? "app",
  dbPassword: process.env.DB_PASSWORD ?? "app",
  dbSchema: process.env.DB_SCHEMA ?? "bookings",
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",")
};
