import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface AuthRequest extends Request { userId?: number; }
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({error:{code:"UNAUTHORIZED",message:"Требуется авторизация"}});
  try { const decoded:any=jwt.verify(h.split(" ")[1],JWT_SECRET); req.userId=decoded.userId; next(); }
  catch { return res.status(401).json({error:{code:"UNAUTHORIZED",message:"Токен недействителен"}}); }
};
export const serviceAuth = (req: Request,res: Response,next: NextFunction) => {
  if ((req.headers["x-service-token"]||"") !== (process.env.SERVICE_TOKEN||"internal-service-token")) return res.status(401).json({error:{code:"UNAUTHORIZED",message:"Ошибка сервисной авторизации"}});
  next();
};
