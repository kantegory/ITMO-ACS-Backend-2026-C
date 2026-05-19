import { Router } from "express";
import { reviewsController } from "../controllers/reviews.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields(["bookingId", "rating", "comment"]),
  asyncHandler((req, res, next) => reviewsController.create(req, res, next))
);
router.get("/", validateNumberQuery("propertyId", true), asyncHandler((req, res, next) => reviewsController.list(req, res, next)));
router.get("/property/:propertyId", validateIdParam("propertyId"), asyncHandler((req, res, next) => reviewsController.getByPropertyId(req, res, next)));
router.get("/:id", validateIdParam(), asyncHandler((req, res, next) => reviewsController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), requireBodyFields(["responseText"]), asyncHandler((req, res, next) => reviewsController.respond(req, res, next)));
router.patch("/:id/respond", authMiddleware, validateIdParam(), requireBodyFields(["responseText"]), asyncHandler((req, res, next) => reviewsController.respond(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => reviewsController.delete(req, res, next)));

export default router;
