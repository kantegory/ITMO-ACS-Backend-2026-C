"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config");
const internal_auth_1 = require("./middleware/internal-auth");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function hashRefresh(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
function registerRoutes(app) {
    app.post("/auth/register", async (req, res) => {
        const { email, password, name, phone, type } = req.body;
        if (!email || !password || !name || !type) {
            return res.status(400).json({ message: "email, password, name, type required" });
        }
        if (!["landlord", "tenant", "admin"].includes(type)) {
            return res.status(400).json({ message: "invalid type" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        try {
            const { rows } = await db_1.pool.query(`INSERT INTO users (email, name, phone, password_hash, type)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, email, name, phone, type, created_at`, [email, name, phone || null, passwordHash, type]);
            const u = rows[0];
            return res.status(201).json({
                id: u.id,
                email: u.email,
                name: u.name,
                type: u.type,
            });
        }
        catch (e) {
            const maybePgError = e;
            if (maybePgError.code === "23505") {
                return res.status(409).json({ message: "email already registered" });
            }
            throw e;
        }
    });
    app.post("/auth/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password required" });
        }
        const { rows } = await db_1.pool.query("SELECT id, email, name, phone, type, password_hash FROM users WHERE email = $1", [email]);
        if (!rows.length) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const u = rows[0];
        const ok = await bcryptjs_1.default.compare(password, u.password_hash);
        if (!ok) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const accessToken = jsonwebtoken_1.default.sign({ sub: u.id, type: u.type, email: u.email }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.accessTtl,
        });
        const refreshToken = crypto_1.default.randomBytes(32).toString("hex");
        const exp = new Date(Date.now() + config_1.config.refreshTtl * 1000);
        await db_1.pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1,$2,$3)`, [u.id, hashRefresh(refreshToken), exp]);
        return res.json({
            accessToken,
            refreshToken,
            user: { id: u.id, email: u.email, name: u.name, type: u.type },
        });
    });
    app.get("/users/:id", async (req, res) => {
        const { rows } = await db_1.pool.query("SELECT id, email, name, type, created_at FROM users WHERE id = $1", [
            req.params.id,
        ]);
        if (!rows.length) {
            return res.status(404).json({ message: "not found" });
        }
        const u = rows[0];
        return res.json({
            id: u.id,
            email: u.email,
            name: u.name,
            type: u.type,
            createdAt: u.created_at,
        });
    });
    app.get("/internal/users/exists", internal_auth_1.internalAuth, async (req, res) => {
        const raw = req.query.ids;
        if (typeof raw !== "string" || !raw.trim()) {
            return res.status(400).json({ code: "BAD_REQUEST", message: "invalid id list" });
        }
        const ids = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (!ids.length || ids.length > 100) {
            return res.status(400).json({ code: "BAD_REQUEST", message: "invalid id list" });
        }
        for (const id of ids) {
            if (!UUID_RE.test(id)) {
                return res.status(400).json({ code: "BAD_REQUEST", message: "invalid id list" });
            }
        }
        const { rows } = await db_1.pool.query("SELECT id FROM users WHERE id = ANY($1::uuid[])", [ids]);
        const found = new Set(rows.map((r) => r.id));
        const exists = {};
        for (const id of ids) {
            exists[id] = found.has(id);
        }
        return res.json({ exists });
    });
    app.get("/internal/users/:id", internal_auth_1.internalAuth, async (req, res) => {
        const { rows } = await db_1.pool.query("SELECT id, email, name, type FROM users WHERE id = $1", [req.params.id]);
        if (!rows.length) {
            return res.status(404).json({ code: "NOT_FOUND", message: "user not found" });
        }
        const u = rows[0];
        return res.json({
            id: u.id,
            email: u.email,
            fullName: u.name,
            type: u.type,
        });
    });
    app.get("/internal/health/live", internal_auth_1.internalAuth, async (req, res) => {
        try {
            await db_1.pool.query("SELECT 1");
        }
        catch {
            return res.status(500).type("text/plain").send("database connection failed");
        }
        return res.status(200).set("Content-Length", "0").end();
    });
}
