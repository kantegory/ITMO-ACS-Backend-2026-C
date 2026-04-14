import { Express, Request, Response } from "express";
import { pool } from "./db";
import { requireAuth } from "./middleware/require-auth";
import { AuthRequest } from "./types";
import { assertUsersExist } from "./clients/user-manager";
import { assertDealVisible, assertListingExists } from "./clients/rent-manager";

export function registerRoutes(app: Express): void {
  app.get("/chats", requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.sub;
    const { rows } = await pool.query(
      `SELECT * FROM chats WHERE user_a_id = $1 OR user_b_id = $1 ORDER BY created_at DESC`,
      [uid]
    );
    res.json({ data: rows });
  });

  app.post("/chats", requireAuth, async (req: AuthRequest, res: Response) => {
    const me = req.user!.sub;
    const { otherUserId, listingId, dealId } = req.body as {
      otherUserId?: string;
      listingId?: string;
      dealId?: string;
    };
    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId required" });
    }
    if (otherUserId === me) {
      return res.status(400).json({ message: "cannot chat with self" });
    }
    if (!(await assertUsersExist([me, otherUserId]))) {
      return res.status(400).json({ message: "user not found" });
    }
    if (listingId && !(await assertListingExists(listingId))) {
      return res.status(400).json({ message: "listing not found" });
    }
    if (dealId && !(await assertDealVisible(dealId, req.headers.authorization || ""))) {
      return res.status(400).json({ message: "deal not found or inaccessible" });
    }
    const ua = me < otherUserId ? me : otherUserId;
    const ub = me < otherUserId ? otherUserId : me;
    const { rows } = await pool.query(
      `INSERT INTO chats (user_a_id, user_b_id, listing_id, deal_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [ua, ub, listingId || null, dealId || null]
    );
    res.status(201).json(rows[0]);
  });

  app.get("/chats/:id/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.sub;
    const { rows: c } = await pool.query<{ user_a_id: string; user_b_id: string }>("SELECT * FROM chats WHERE id = $1", [
      req.params.id,
    ]);
    if (!c.length) return res.status(404).json({ message: "chat not found" });
    const chat = c[0];
    if (chat.user_a_id !== uid && chat.user_b_id !== uid) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { rows } = await pool.query(`SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`, [
      req.params.id,
    ]);
    res.json({ chatId: req.params.id, data: rows });
  });

  app.post("/chats/:id/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.sub;
    const { text } = req.body as { text?: string };
    if (!text) return res.status(400).json({ message: "text required" });
    const { rows: c } = await pool.query<{ user_a_id: string; user_b_id: string }>("SELECT * FROM chats WHERE id = $1", [
      req.params.id,
    ]);
    if (!c.length) return res.status(404).json({ message: "chat not found" });
    const chat = c[0];
    if (chat.user_a_id !== uid && chat.user_b_id !== uid) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { rows } = await pool.query(`INSERT INTO messages (chat_id, sender_id, text) VALUES ($1,$2,$3) RETURNING *`, [
      req.params.id,
      uid,
      text,
    ]);
    res.status(201).json(rows[0]);
  });

  app.patch("/messages/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.sub;
    const { text } = req.body as { text?: string };
    if (!text) return res.status(400).json({ message: "text required" });
    const { rows: m } = await pool.query<{ sender_id: string }>(`SELECT m.* FROM messages m WHERE m.id = $1`, [
      req.params.id,
    ]);
    if (!m.length) return res.status(404).json({ message: "not found" });
    if (m[0].sender_id !== uid) return res.status(403).json({ message: "forbidden" });
    const { rows } = await pool.query(`UPDATE messages SET text = $1, edited = true WHERE id = $2 RETURNING *`, [
      text,
      req.params.id,
    ]);
    res.json(rows[0]);
  });

  app.post("/reviews", requireAuth, async (req: AuthRequest, res: Response) => {
    const authorId = req.user!.sub;
    const { targetId, rating, text, dealId, listingId } = req.body as {
      targetId?: string;
      rating?: number;
      text?: string;
      dealId?: string;
      listingId?: string;
    };
    if (!targetId || rating == null) {
      return res.status(400).json({ message: "targetId and rating required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating 1..5" });
    }
    if (!(await assertUsersExist([authorId, targetId]))) {
      return res.status(400).json({ message: "user not found" });
    }
    if (listingId && !(await assertListingExists(listingId))) {
      return res.status(400).json({ message: "listing not found" });
    }
    if (dealId && !(await assertDealVisible(dealId, req.headers.authorization || ""))) {
      return res.status(400).json({ message: "deal not found or inaccessible" });
    }
    const { rows } = await pool.query(
      `INSERT INTO reviews (author_id, target_id, rating, text, deal_id, listing_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [authorId, targetId, rating, text || null, dealId || null, listingId || null]
    );
    res.status(201).json(rows[0]);
  });

  app.get("/users/:userId/reviews", async (req: Request, res: Response) => {
    const { rows } = await pool.query(`SELECT * FROM reviews WHERE target_id = $1 ORDER BY created_at DESC`, [
      req.params.userId,
    ]);
    res.json({ userId: req.params.userId, data: rows });
  });
}
