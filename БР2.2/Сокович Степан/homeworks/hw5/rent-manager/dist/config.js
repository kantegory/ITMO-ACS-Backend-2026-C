"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: Number(process.env.PORT || 3002),
    jwtSecret: process.env.JWT_SECRET || "dev",
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token",
    userManagerUrl: process.env.USER_MANAGER_URL || "http://localhost:3001",
    kafkaClientId: process.env.KAFKA_CLIENT_ID || "rent-manager",
    kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    userRpcTopic: process.env.USER_RPC_TOPIC || "user.rpc.requests",
    rentRpcTopic: process.env.RENT_RPC_TOPIC || "rent.rpc.requests",
    rpcReplyTopic: process.env.RPC_REPLY_TOPIC || "rent-manager.rpc.replies",
    rpcTimeoutMs: Number(process.env.KAFKA_RPC_TIMEOUT_MS || 5000),
};
