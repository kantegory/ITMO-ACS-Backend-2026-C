import { Router } from "express";
import { UserRole } from "../models/User";
import { usersController } from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateIdParam, validatePagination } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/", authMiddleware, validatePagination, asyncHandler((req, res, next) => usersController.list(req, res, next)));
router.get("/me", authMiddleware, asyncHandler((req, res, next) => usersController.getMe(req, res, next)));
router.patch("/me", authMiddleware, asyncHandler((req, res, next) => usersController.updateMe(req, res, next)));
router.get("/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), validateIdParam(), asyncHandler((req, res, next) => usersController.getById(req, res, next)));
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => usersController.update(req, res, next)));
router.delete("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => usersController.delete(req, res, next)));

export default router;
