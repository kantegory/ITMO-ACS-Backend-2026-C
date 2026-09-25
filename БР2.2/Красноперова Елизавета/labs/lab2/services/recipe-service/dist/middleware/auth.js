"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAuth = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const authMiddleware = (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer "))
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Требуется авторизация" } });
    try {
        const decoded = jsonwebtoken_1.default.verify(h.split(" ")[1], JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (_a) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Токен недействителен" } });
    }
};
exports.authMiddleware = authMiddleware;
const serviceAuth = (req, res, next) => {
    if ((req.headers["x-service-token"] || "") !== (process.env.SERVICE_TOKEN || "internal-service-token"))
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Ошибка сервисной авторизации" } });
    next();
};
exports.serviceAuth = serviceAuth;
