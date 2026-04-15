import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthRequest, TokenPayload } from "../types";

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response | void {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" });
  }
  try {
    req.user = jwt.verify(h.slice(7), config.jwtSecret) as TokenPayload;
    next();
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
}
