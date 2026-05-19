import { Router } from "express";
import { chatsController } from "../controllers/chats.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields(["propertyId"]),
  asyncHandler((req, res, next) => chatsController.create(req, res, next))
);
router.get("/", authMiddleware, asyncHandler((req, res, next) => chatsController.getAll(req, res, next)));
router.get("/my", authMiddleware, asyncHandler((req, res, next) => chatsController.getMy(req, res, next)));
router.get("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => chatsController.getById(req, res, next)));

export default router;
