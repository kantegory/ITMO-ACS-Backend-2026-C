import { Router } from "express";
import { UserRole } from "../models/User";
import { bookingsController } from "../controllers/bookings.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { requireBodyFields, validateIdParam, validatePagination } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields(["propertyId", "startDate", "endDate", "guestsCount"]),
  asyncHandler((req, res, next) => bookingsController.create(req, res, next))
);
router.get("/", authMiddleware, roleMiddleware(UserRole.ADMIN), validatePagination, asyncHandler((req, res, next) => bookingsController.list(req, res, next)));
router.get("/incoming", authMiddleware, validatePagination, asyncHandler((req, res, next) => bookingsController.incoming(req, res, next)));
router.get("/my", authMiddleware, validatePagination, asyncHandler((req, res, next) => bookingsController.getMy(req, res, next)));
router.get("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.update(req, res, next)));
router.patch("/:id/confirm", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.confirm(req, res, next)));
router.patch("/:id/cancel", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.cancel(req, res, next)));
router.patch("/:id/complete", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.complete(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => bookingsController.delete(req, res, next)));

export default router;
