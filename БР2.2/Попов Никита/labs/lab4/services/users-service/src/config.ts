export const config = {
  port: Number(process.env.PORT ?? 8081),
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 15441),
    username: process.env.DB_USER ?? "app",
    password: process.env.DB_PASSWORD ?? "app",
    database: process.env.DB_NAME ?? "app_db",
    schema: process.env.DB_SCHEMA ?? "users"
  },
  jwtSecret: process.env.JWT_SECRET ?? "secret",
  internalApiKey: process.env.INTERNAL_API_KEY ?? "internal-secret",
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",")
};
