import { NextFunction, Request, Response } from "express";
import { config } from "../config";

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.header("X-Internal-Api-Key") !== config.internalApiKey) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Требуется аутентификация внутреннего вызова" });
  }
  next();
}
