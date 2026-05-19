import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { createRateLimit } from "../middleware/rate-limit.middleware";
import {
  requireBodyFields,
  validateLoginBody,
  validateRefreshBody,
  validateRegisterBody,
} from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Слишком много попыток входа. Повторите позже.",
  keyGenerator: (req) => `${req.ip || "unknown"}:${String(req.body?.email || "").toLowerCase().trim()}`,
});

router.post(
  "/register",
  requireBodyFields(["firstName", "lastName", "email", "password"]),
  validateRegisterBody,
  asyncHandler((req, res, next) => authController.register(req, res, next))
);
router.post(
  "/login",
  loginRateLimit,
  requireBodyFields(["email", "password"]),
  validateLoginBody,
  asyncHandler((req, res, next) => authController.login(req, res, next))
);
router.post(
  "/refresh",
  requireBodyFields(["refreshToken"]),
  validateRefreshBody,
  asyncHandler((req, res, next) => authController.refresh(req, res, next))
);
router.post(
  "/logout",
  requireBodyFields(["refreshToken"]),
  validateRefreshBody,
  asyncHandler((req, res, next) => authController.logout(req, res, next))
);

export default router;
