import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const AUTH = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const VACANCY = process.env.VACANCY_SERVICE_URL || "http://localhost:3002";
const APPLICATION = process.env.APPLICATION_SERVICE_URL || "http://localhost:3003";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

const strip = { "^/api": "" };

// Прокси монтируются на корень и выбираются по pathFilter,
// чтобы Express не срезал префикс из req.url (важно для pathRewrite).
// Порядок важен: более специфичные правила идут раньше.

// 1. Отклик на вакансию -> application-service (специфичнее, чем /vacancies)
app.use(
  createProxyMiddleware({
    target: APPLICATION,
    changeOrigin: true,
    pathRewrite: strip,
    pathFilter: (path) => /^\/api\/vacancies\/\d+\/apply\/?$/.test(path),
  })
);

// 2. Auth -> auth-service
app.use(
  createProxyMiddleware({
    target: AUTH,
    changeOrigin: true,
    pathRewrite: strip,
    pathFilter: "/api/auth/**",
  })
);

// 3. Компании и вакансии -> vacancy-service
app.use(
  createProxyMiddleware({
    target: VACANCY,
    changeOrigin: true,
    pathRewrite: strip,
    pathFilter: ["/api/companies/**", "/api/companies", "/api/vacancies/**", "/api/vacancies"],
  })
);

// 4. Резюме и отклики -> application-service
app.use(
  createProxyMiddleware({
    target: APPLICATION,
    changeOrigin: true,
    pathRewrite: strip,
    pathFilter: ["/api/resume/**", "/api/resume", "/api/applications/**", "/api/applications"],
  })
);

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => console.log(`api-gateway on ${PORT}`));
