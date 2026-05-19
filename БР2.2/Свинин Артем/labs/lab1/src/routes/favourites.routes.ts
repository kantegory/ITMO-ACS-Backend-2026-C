import { Router } from "express";
import { favouritesController } from "../controllers/favourites.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/", authMiddleware, requireBodyFields(["propertyId"]), asyncHandler((req, res, next) => favouritesController.create(req, res, next)));
router.get("/", authMiddleware, asyncHandler((req, res, next) => favouritesController.getMy(req, res, next)));
router.get("/my", authMiddleware, asyncHandler((req, res, next) => favouritesController.getMy(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => favouritesController.deleteById(req, res, next)));
router.delete("/property/:propertyId", authMiddleware, validateIdParam("propertyId"), asyncHandler((req, res, next) => favouritesController.deleteByPropertyId(req, res, next)));

export default router;
