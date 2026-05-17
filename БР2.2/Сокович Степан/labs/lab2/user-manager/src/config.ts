export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "dev",
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token",
  accessTtl: Number(process.env.ACCESS_TOKEN_TTL_SEC || 900),
  refreshTtl: Number(process.env.REFRESH_TOKEN_TTL_SEC || 604800),
};
