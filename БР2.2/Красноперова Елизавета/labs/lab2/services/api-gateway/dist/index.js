"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = 3000;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || "http://localhost:3002";
const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || "http://localhost:3003";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal-service-token";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
async function callService(baseUrl, path, options = {}) {
    var _a;
    let response;
    try {
        response = await fetch(baseUrl + path, options);
    }
    catch (_b) {
        const error = new Error("Зависимый сервис недоступен");
        error.status = 503;
        error.data = { error: { code: "SERVICE_UNAVAILABLE", message: "Зависимый сервис недоступен" } };
        throw error;
    }
    let data = null;
    try {
        data = await response.json();
    }
    catch ( /* empty */_c) { /* empty */ }
    if (!response.ok) {
        const error = new Error(((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) || (data === null || data === void 0 ? void 0 : data.message) || "Ошибка сервиса");
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return { status: response.status, data };
}
function getVerifiedUserId(req) {
    const header = req.headers.authorization;
    if (!(header === null || header === void 0 ? void 0 : header.startsWith("Bearer ")))
        return undefined;
    try {
        const decoded = jsonwebtoken_1.default.verify(header.slice(7), JWT_SECRET);
        const userId = Number(decoded.userId);
        return Number.isInteger(userId) && userId > 0 ? userId : undefined;
    }
    catch (_a) {
        return undefined;
    }
}
function getTarget(path) {
    if (/^\/api\/recipes\/\d+\/(like|save|comments)/.test(path))
        return SOCIAL_SERVICE_URL;
    if (/^\/api\/users\/\d+\/subscribe/.test(path))
        return SOCIAL_SERVICE_URL;
    if (path === "/api/users/me/subscriptions" || path === "/api/users/me/subscribers")
        return SOCIAL_SERVICE_URL;
    if (/^\/api\/comments/.test(path))
        return SOCIAL_SERVICE_URL;
    if (path === "/api/users/me/saved")
        return USER_SERVICE_URL;
    if (path === "/api/recipes" || path === "/api/recipes/mine" || /^\/api\/recipes\/\d+/.test(path))
        return RECIPE_SERVICE_URL;
    if (/^\/api\/auth/.test(path))
        return USER_SERVICE_URL;
    if (path === "/api/users/me/recipes")
        return USER_SERVICE_URL;
    if (/^\/api\/users/.test(path))
        return USER_SERVICE_URL;
    return null;
}
async function getRecipes(req, res) {
    try {
        const recipeResponse = await callService(RECIPE_SERVICE_URL, req.originalUrl, {
            method: "GET"
        });
        const payload = recipeResponse.data || { items: [], total: 0, page: 1, limit: 20 };
        const items = Array.isArray(payload.items) ? payload.items : [];
        // RecipeService already applies the filters/pagination and obtains the social
        // summary for each returned recipe. Keep the public contract unchanged.
        return res.status(recipeResponse.status).json({
            ...payload,
            items
        });
    }
    catch (error) {
        return res.status(error.status || 500).json(error.data || {
            error: { code: "INTERNAL_ERROR", message: "Ошибка получения рецептов" }
        });
    }
}
async function getRecipe(req, res) {
    var _a, _b, _c, _d;
    try {
        const recipeResponse = await callService(RECIPE_SERVICE_URL, req.originalUrl, {
            method: "GET"
        });
        const recipe = recipeResponse.data;
        if (!recipe)
            return res.status(recipeResponse.status).json(recipe);
        const userId = getVerifiedUserId(req);
        const query = userId !== undefined ? `?user_id=${encodeURIComponent(userId)}` : "";
        let socialSummary = {
            likes_count: 0,
            comments_count: 0,
            is_liked_by_me: false,
            is_saved_by_me: false
        };
        try {
            const summary = await callService(SOCIAL_SERVICE_URL, `/internal/recipes/${recipe.recipe_id}/summary${query}`, { method: "GET", headers: { "x-service-token": SERVICE_TOKEN } });
            socialSummary = {
                likes_count: Number((_a = summary.data) === null || _a === void 0 ? void 0 : _a.likes_count) || 0,
                comments_count: Number((_b = summary.data) === null || _b === void 0 ? void 0 : _b.comments_count) || 0,
                is_liked_by_me: Boolean((_c = summary.data) === null || _c === void 0 ? void 0 : _c.is_liked_by_me),
                is_saved_by_me: Boolean((_d = summary.data) === null || _d === void 0 ? void 0 : _d.is_saved_by_me)
            };
        }
        catch (_e) {
            // Recipe data remains available even if optional social enrichment fails.
        }
        return res.status(recipeResponse.status).json({ ...recipe, ...socialSummary });
    }
    catch (error) {
        return res.status(error.status || 500).json(error.data || {
            error: { code: "INTERNAL_ERROR", message: "Ошибка получения рецепта" }
        });
    }
}
async function proxy(req, res, target) {
    try {
        const headers = {};
        if (req.headers.authorization)
            headers.authorization = req.headers.authorization;
        if (req.headers["content-type"])
            headers["content-type"] = req.headers["content-type"];
        if (req.path.startsWith("/internal/"))
            headers["x-service-token"] = SERVICE_TOKEN;
        let body;
        if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length > 0) {
            body = JSON.stringify(req.body);
            if (!headers["content-type"])
                headers["content-type"] = "application/json";
        }
        const result = await callService(target, req.originalUrl, {
            method: req.method,
            headers,
            body
        });
        return res.status(result.status).json(result.data);
    }
    catch (error) {
        return res.status(error.status || 500).json(error.data || {
            error: { code: "INTERNAL_ERROR", message: error.message || "Ошибка сервиса" }
        });
    }
}
app.get("/api/recipes", getRecipes);
app.get(/^\/api\/recipes\/\d+$/, getRecipe);
app.use(async (req, res) => {
    const target = getTarget(req.path);
    if (!target)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Маршрут не найден" } });
    return proxy(req, res, target);
});
app.listen(PORT, () => console.log(`API Gateway running on http://localhost:${PORT}`));
