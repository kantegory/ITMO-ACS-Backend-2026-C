import { Router } from "express";
import { transactionsController } from "../controllers/transactions.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields(["bookingId", "paymentMethod"]),
  asyncHandler((req, res, next) => transactionsController.create(req, res, next))
);
router.get("/", authMiddleware, validateNumberQuery("bookingId", true), asyncHandler((req, res, next) => transactionsController.list(req, res, next)));
router.get("/booking/:bookingId", authMiddleware, validateIdParam("bookingId"), asyncHandler((req, res, next) => transactionsController.getByBookingId(req, res, next)));
router.get("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => transactionsController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => transactionsController.update(req, res, next)));
router.patch("/:id/refund", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => transactionsController.refund(req, res, next)));

export default router;
