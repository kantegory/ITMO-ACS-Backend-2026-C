import { NextFunction, Request, Response } from "express";
import { sendApiError } from "../utils/api-error";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const createRateLimit = (options: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || "unknown";
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.max) {
      sendApiError(res, 429, options.message);
      return;
    }

    entry.count += 1;
    next();
  };
};

