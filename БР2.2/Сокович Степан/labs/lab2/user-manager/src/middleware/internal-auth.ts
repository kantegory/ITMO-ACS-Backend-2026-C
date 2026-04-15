import { NextFunction, Request, Response } from "express";
import { config } from "../config";

export function internalAuth(req: Request, res: Response, next: NextFunction): Response | void {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "invalid service credentials",
    });
  }
  if (h.slice(7) !== config.internalToken) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "invalid service credentials",
    });
  }
  next();
}
