import { Router } from "express";
import { UserRole } from "../models/User";
import { propertyTypesController } from "../controllers/property-types.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateIdParam } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/", authMiddleware, roleMiddleware(UserRole.ADMIN), asyncHandler((req, res, next) => propertyTypesController.create(req, res, next)));
router.get("/", asyncHandler((req, res, next) => propertyTypesController.getAll(req, res, next)));
router.get("/:id", validateIdParam(), asyncHandler((req, res, next) => propertyTypesController.getById(req, res, next)));
router.patch("/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), validateIdParam(), asyncHandler((req, res, next) => propertyTypesController.update(req, res, next)));
router.delete("/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), validateIdParam(), asyncHandler((req, res, next) => propertyTypesController.delete(req, res, next)));

export default router;
