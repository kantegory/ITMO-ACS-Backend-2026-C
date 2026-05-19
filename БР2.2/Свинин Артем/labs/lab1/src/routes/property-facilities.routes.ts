import { Router } from "express";
import { propertyFacilitiesController } from "../controllers/property-facilities.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/", authMiddleware, requireBodyFields(["propertyId", "facilityId"]), asyncHandler((req, res, next) => propertyFacilitiesController.create(req, res, next)));
router.get("/", validateNumberQuery("propertyId", true), asyncHandler((req, res, next) => propertyFacilitiesController.list(req, res, next)));
router.get("/property/:propertyId", validateIdParam("propertyId"), asyncHandler((req, res, next) => propertyFacilitiesController.getByPropertyId(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => propertyFacilitiesController.delete(req, res, next)));

export default router;
