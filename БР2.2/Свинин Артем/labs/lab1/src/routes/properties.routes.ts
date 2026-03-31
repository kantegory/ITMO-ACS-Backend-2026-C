import { Router } from "express";
import { propertiesController } from "../controllers/properties.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields([
    "typeId",
    "addressId",
    "title",
    "description",
    "pricePerDay",
    "pricePerMonth",
    "areaSqM",
    "maxGuests",
    "bedrooms",
    "bathrooms",
    "minRentDays",
    "maxRentDays",
  ]),
  asyncHandler((req, res, next) => propertiesController.create(req, res, next))
);
router.get("/my", authMiddleware, asyncHandler((req, res, next) => propertiesController.getMy(req, res, next)));
router.get("/", asyncHandler((req, res, next) => propertiesController.getAll(req, res, next)));
router.get("/:id", validateIdParam(), asyncHandler((req, res, next) => propertiesController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => propertiesController.update(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => propertiesController.delete(req, res, next)));

export default router;
