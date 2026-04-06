import dotenv from "dotenv";

dotenv.config();

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const parsePort = (name: string): number => {
  const raw = requireEnv(name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return value;
};

const parseBoolean = (name: string, defaultValue: boolean): boolean => {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw.trim() === "") {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  throw new Error(`Environment variable ${name} must be a boolean`);
};

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: parsePort("DB_PORT"),
  DB_USERNAME: requireEnv("DB_USERNAME"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  DB_NAME: requireEnv("DB_NAME"),
  DB_SYNCHRONIZE: parseBoolean("DB_SYNCHRONIZE", true),
  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
};
