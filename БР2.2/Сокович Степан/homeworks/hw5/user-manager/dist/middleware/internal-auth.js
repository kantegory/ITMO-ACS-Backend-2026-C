"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalAuth = internalAuth;
const config_1 = require("../config");
function internalAuth(req, res, next) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) {
        return res.status(401).json({
            code: "UNAUTHORIZED",
            message: "invalid service credentials",
        });
    }
    if (h.slice(7) !== config_1.config.internalToken) {
        return res.status(401).json({
            code: "UNAUTHORIZED",
            message: "invalid service credentials",
        });
    }
    next();
}
