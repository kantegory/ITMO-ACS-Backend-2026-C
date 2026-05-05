"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: Number(process.env.PORT || 3001),
    jwtSecret: process.env.JWT_SECRET || "dev",
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token",
    accessTtl: Number(process.env.ACCESS_TOKEN_TTL_SEC || 900),
    refreshTtl: Number(process.env.REFRESH_TOKEN_TTL_SEC || 604800),
    kafkaClientId: process.env.KAFKA_CLIENT_ID || "user-manager",
    kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    userRpcTopic: process.env.USER_RPC_TOPIC || "user.rpc.requests",
};
