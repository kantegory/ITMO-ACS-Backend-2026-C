"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: Number(process.env.PORT || 3002),
    jwtSecret: process.env.JWT_SECRET || "dev",
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token",
    userManagerUrl: process.env.USER_MANAGER_URL || "http://localhost:3001",
};
