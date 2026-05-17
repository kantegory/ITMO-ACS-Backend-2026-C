import { Express, Request, Response } from "express";
import { pool } from "./db";
import { requireAuth } from "./middleware/require-auth";
import { AuthRequest } from "./types";
import { assertUsersExist } from "./clients/user-manager";

export function registerRoutes(app: Express): void {
  app.get("/amenities", async (req: Request, res: Response) => {
    const { rows } = await pool.query("SELECT id, name FROM amenities ORDER BY id");
    res.json({ data: rows });
  });

  app.get("/estate-types", async (req: Request, res: Response) => {
    const { rows } = await pool.query("SELECT id, name FROM estate_types ORDER BY id");
    res.json({ data: rows });
  });

  app.get("/listings", async (req: Request, res: Response) => {
    const { rows } = await pool.query(
      `SELECT id, created_at, owner_id, type_id, name, price, deposit, description, city, address
       FROM listings ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ data: rows });
  });

  app.post("/listings", requireAuth, async (req: AuthRequest, res: Response) => {
    const ownerId = req.user!.sub;
    const { typeId, name, price, deposit, description, city, address, amenityIds } = req.body as {
      typeId?: number;
      name?: string;
      price?: number;
      deposit?: number;
      description?: string;
      city?: string;
      address?: string;
      amenityIds?: number[];
    };
    if (!typeId || !name || price == null) {
      return res.status(400).json({ message: "typeId, name, price required" });
    }
    if (!(await assertUsersExist([ownerId]))) {
      return res.status(400).json({ message: "owner not found" });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO listings (owner_id, type_id, name, price, deposit, description, city, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, created_at, owner_id, type_id, name, price, deposit, city, address`,
        [ownerId, typeId, name, price, deposit ?? null, description || null, city || null, address || null]
      );
      const listing = rows[0];
      if (Array.isArray(amenityIds)) {
        for (const aid of amenityIds) {
          await client.query(
            `INSERT INTO listing_amenities (listing_id, amenity_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [listing.id, aid]
          );
        }
      }
      await client.query("COMMIT");
      return res.status(201).json(listing);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

  app.get("/listings/:id", async (req: Request, res: Response) => {
    const { rows } = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "not found" });
    const { rows: photos } = await pool.query("SELECT id, url FROM listing_photos WHERE listing_id = $1", [
      req.params.id,
    ]);
    res.json({ ...rows[0], photos });
  });

  app.post("/listings/:id/photos", requireAuth, async (req: AuthRequest, res: Response) => {
    const { url } = req.body as { url?: string };
    if (!url) return res.status(400).json({ message: "url required" });
    const { rows: l } = await pool.query<{ owner_id: string }>("SELECT owner_id FROM listings WHERE id = $1", [
      req.params.id,
    ]);
    if (!l.length) return res.status(404).json({ message: "listing not found" });
    if (l[0].owner_id !== req.user!.sub) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { rows } = await pool.query(
      `INSERT INTO listing_photos (listing_id, url) VALUES ($1,$2) RETURNING id, listing_id, url`,
      [req.params.id, url]
    );
    res.status(201).json(rows[0]);
  });

  app.get("/deals", requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.sub;
    const { rows } = await pool.query(
      `SELECT * FROM deals WHERE landlord_id = $1 OR tenant_id = $1 ORDER BY created_at DESC`,
      [uid]
    );
    res.json({ data: rows });
  });

  app.post("/deals", requireAuth, async (req: AuthRequest, res: Response) => {
    const { listingId, tenantId, startTime, endTime } = req.body as {
      listingId?: string;
      tenantId?: string;
      startTime?: string;
      endTime?: string;
    };
    if (!listingId || !tenantId) {
      return res.status(400).json({ message: "listingId and tenantId required" });
    }
    const landlordId = req.user!.sub;
    const { rows: l } = await pool.query<{ owner_id: string }>("SELECT owner_id FROM listings WHERE id = $1", [
      listingId,
    ]);
    if (!l.length) return res.status(404).json({ message: "listing not found" });
    if (l[0].owner_id !== landlordId) {
      return res.status(403).json({ message: "only listing owner creates deal as landlord" });
    }
    if (!(await assertUsersExist([tenantId]))) {
      return res.status(400).json({ message: "tenant not found" });
    }
    const { rows } = await pool.query(
      `INSERT INTO deals (listing_id, landlord_id, tenant_id, start_time, end_time, status)
       VALUES ($1,$2,$3,$4,$5,'pending')
       RETURNING *`,
      [listingId, landlordId, tenantId, startTime || null, endTime || null]
    );
    res.status(201).json(rows[0]);
  });

  app.patch("/deals/:id/status", requireAuth, async (req: AuthRequest, res: Response) => {
    const { status } = req.body as { status?: string };
    if (!status) return res.status(400).json({ message: "status required" });
    const { rows } = await pool.query("SELECT * FROM deals WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "not found" });
    const d = rows[0] as { landlord_id: string; tenant_id: string };
    const uid = req.user!.sub;
    if (d.landlord_id !== uid && d.tenant_id !== uid) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { rows: upd } = await pool.query(`UPDATE deals SET status = $1 WHERE id = $2 RETURNING *`, [
      status,
      req.params.id,
    ]);
    res.json(upd[0]);
  });
}
