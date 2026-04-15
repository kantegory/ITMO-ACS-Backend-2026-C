"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyRoutes = proxyRoutes;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const config_1 = require("./config");
const userProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.config.userServiceUrl,
    changeOrigin: true,
});
const rentProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.config.rentServiceUrl,
    changeOrigin: true,
});
const commProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.config.commServiceUrl,
    changeOrigin: true,
});
function proxyRoutes(req, res, next) {
    const p = req.path;
    if (/^\/users\/[^/]+\/reviews\/?$/.test(p)) {
        void commProxy(req, res, next);
        return;
    }
    if (p.startsWith("/auth") || p.startsWith("/users")) {
        void userProxy(req, res, next);
        return;
    }
    if (p.startsWith("/properties")) {
        req.url = req.url.replace(/^\/properties/, "/listings");
    }
    if (p.startsWith("/amenities") ||
        p.startsWith("/estate-types") ||
        p.startsWith("/listings") ||
        p.startsWith("/properties") ||
        p.startsWith("/deals")) {
        void rentProxy(req, res, next);
        return;
    }
    if (p.startsWith("/chats") || p.startsWith("/messages") || p.startsWith("/reviews")) {
        void commProxy(req, res, next);
        return;
    }
    res.status(404).json({ message: "Не найдено" });
}
