import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const AUTH_SERVICE_URL =
    process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const CATALOG_SERVICE_URL =
    process.env.CATALOG_SERVICE_URL || "http://localhost:4002";
const BOOKING_SERVICE_URL =
    process.env.BOOKING_SERVICE_URL || "http://localhost:4003";

const app = express();

app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "api-gateway" });
});

app.use(
    createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/api/auth",
        pathRewrite: { "^/api/auth": "" },
    })
);

app.use(
    createProxyMiddleware({
        target: CATALOG_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/api/restaurants",
        pathRewrite: { "^/api/restaurants": "/restaurants" },
    })
);

app.use(
    createProxyMiddleware({
        target: BOOKING_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/api/reservations",
        pathRewrite: { "^/api/reservations": "/reservations" },
    })
);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
