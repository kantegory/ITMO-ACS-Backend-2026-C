import { Router } from "express";
import { addressesController } from "../controllers/addresses.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateIdParam } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/", authMiddleware, asyncHandler((req, res, next) => addressesController.create(req, res, next)));
router.get("/", asyncHandler((req, res, next) => addressesController.getAll(req, res, next)));
router.get("/:id", validateIdParam(), asyncHandler((req, res, next) => addressesController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => addressesController.update(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => addressesController.delete(req, res, next)));

export default router;
