export const config = {
  port: Number(process.env.PORT || 3003),
  jwtSecret: process.env.JWT_SECRET || "dev",
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token",
  userManagerUrl: process.env.USER_MANAGER_URL || "http://localhost:3001",
  rentManagerUrl: process.env.RENT_MANAGER_URL || "http://localhost:3002",
};
