export const config = {
  port: Number(process.env.PORT || 3000),
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3001",
  rentServiceUrl: process.env.RENT_SERVICE_URL || "http://localhost:3002",
  commServiceUrl: process.env.COMM_SERVICE_URL || "http://localhost:3003",
};
