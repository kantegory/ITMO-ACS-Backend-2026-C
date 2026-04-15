"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function requireAuth(req, res, next) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) {
        return res.status(401).json({ message: "unauthorized" });
    }
    try {
        req.user = jsonwebtoken_1.default.verify(h.slice(7), config_1.config.jwtSecret);
        next();
    }
    catch {
        return res.status(401).json({ message: "unauthorized" });
    }
}
