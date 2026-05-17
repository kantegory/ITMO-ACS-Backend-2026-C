import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "./config";

const userProxy = createProxyMiddleware({
  target: config.userServiceUrl,
  changeOrigin: true,
});

const rentProxy = createProxyMiddleware({
  target: config.rentServiceUrl,
  changeOrigin: true,
});

const commProxy = createProxyMiddleware({
  target: config.commServiceUrl,
  changeOrigin: true,
});

export function proxyRoutes(req: Request, res: Response, next: NextFunction): void {
  const p = req.path;

  if (/^\/users\/[^/]+\/reviews\/?$/.test(p)) {
    void commProxy(req, res, next);
    return;
  }

  if (p.startsWith("/auth") || p.startsWith("/users")) {
    void userProxy(req, res, next);
    return;
  }

  if (p.startsWith("/properties")) {
    req.url = req.url.replace(/^\/properties/, "/listings");
  }

  if (
    p.startsWith("/amenities") ||
    p.startsWith("/estate-types") ||
    p.startsWith("/listings") ||
    p.startsWith("/properties") ||
    p.startsWith("/deals")
  ) {
    void rentProxy(req, res, next);
    return;
  }

  if (p.startsWith("/chats") || p.startsWith("/messages") || p.startsWith("/reviews")) {
    void commProxy(req, res, next);
    return;
  }

  res.status(404).json({ message: "Не найдено" });
}
