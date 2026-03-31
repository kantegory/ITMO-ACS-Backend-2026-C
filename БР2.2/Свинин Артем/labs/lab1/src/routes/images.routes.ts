import { Router } from "express";
import { imagesController } from "../controllers/images.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/", authMiddleware, requireBodyFields(["propertyId", "imageUrl"]), asyncHandler((req, res, next) => imagesController.create(req, res, next)));
router.get("/", validateNumberQuery("propertyId", true), asyncHandler((req, res, next) => imagesController.list(req, res, next)));
router.get("/property/:propertyId", validateIdParam("propertyId"), asyncHandler((req, res, next) => imagesController.getByPropertyId(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => imagesController.delete(req, res, next)));

export default router;
