import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "./db";
import { config } from "./config";
import { internalAuth } from "./middleware/internal-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashRefresh(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function registerRoutes(app: Express): void {
  app.post("/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, phone, type } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      type?: string;
    };

    if (!email || !password || !name || !type) {
      return res.status(400).json({ message: "email, password, name, type required" });
    }
    if (!["landlord", "tenant", "admin"].includes(type)) {
      return res.status(400).json({ message: "invalid type" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, phone, password_hash, type)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, email, name, phone, type, created_at`,
        [email, name, phone || null, passwordHash, type]
      );
      const u = rows[0] as { id: string; email: string; name: string; type: string };
      return res.status(201).json({
        id: u.id,
        email: u.email,
        name: u.name,
        type: u.type,
      });
    } catch (e: unknown) {
      const maybePgError = e as { code?: string };
      if (maybePgError.code === "23505") {
        return res.status(409).json({ message: "email already registered" });
      }
      throw e;
    }
  });

  app.post("/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }
    const { rows } = await pool.query(
      "SELECT id, email, name, phone, type, password_hash FROM users WHERE email = $1",
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    const u = rows[0] as {
      id: string;
      email: string;
      name: string;
      type: string;
      password_hash: string;
    };
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const accessToken = jwt.sign({ sub: u.id, type: u.type, email: u.email }, config.jwtSecret, {
      expiresIn: config.accessTtl,
    });
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + config.refreshTtl * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1,$2,$3)`,
      [u.id, hashRefresh(refreshToken), exp]
    );
    return res.json({
      accessToken,
      refreshToken,
      user: { id: u.id, email: u.email, name: u.name, type: u.type },
    });
  });

  app.get("/users/:id", async (req: Request, res: Response) => {
    const { rows } = await pool.query("SELECT id, email, name, type, created_at FROM users WHERE id = $1", [
      req.params.id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: "not found" });
    }
    const u = rows[0] as {
      id: string;
      email: string;
      name: string;
      type: string;
      created_at: string;
    };
    return res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      type: u.type,
      createdAt: u.created_at,
    });
  });

  app.get("/internal/users/exists", internalAuth, async (req: Request, res: Response) => {
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
    const { rows } = await pool.query("SELECT id FROM users WHERE id = ANY($1::uuid[])", [ids]);
    const found = new Set(rows.map((r) => (r as { id: string }).id));
    const exists: Record<string, boolean> = {};
    for (const id of ids) {
      exists[id] = found.has(id);
    }
    return res.json({ exists });
  });

  app.get("/internal/users/:id", internalAuth, async (req: Request, res: Response) => {
    const { rows } = await pool.query("SELECT id, email, name, type FROM users WHERE id = $1", [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ code: "NOT_FOUND", message: "user not found" });
    }
    const u = rows[0] as { id: string; email: string; name: string; type: string };
    return res.json({
      id: u.id,
      email: u.email,
      fullName: u.name,
      type: u.type,
    });
  });

  app.get("/internal/health/live", internalAuth, async (req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
    } catch {
      return res.status(500).type("text/plain").send("database connection failed");
    }
    return res.status(200).set("Content-Length", "0").end();
  });
}
