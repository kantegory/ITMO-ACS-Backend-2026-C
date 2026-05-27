import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "api-gateway" });
});

app.use(
    createProxyMiddleware({
        target: "http://localhost:4001",
        changeOrigin: true,
        pathFilter: "/api/auth",
        pathRewrite: { "^/api/auth": "" },
    })
);

app.use(
    createProxyMiddleware({
        target: "http://localhost:4002",
        changeOrigin: true,
        pathFilter: "/api/restaurants",
        pathRewrite: { "^/api/restaurants": "/restaurants" },
    })
);

app.use(
    createProxyMiddleware({
        target: "http://localhost:4003",
        changeOrigin: true,
        pathFilter: "/api/reservations",
        pathRewrite: { "^/api/reservations": "/reservations" },
    })
);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
