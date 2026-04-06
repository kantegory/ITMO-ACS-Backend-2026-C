import { Router } from "express";
import { messagesController } from "../controllers/messages.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireBodyFields, validateIdParam, validateNumberQuery, validatePagination } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireBodyFields(["chatId", "content"]),
  asyncHandler((req, res, next) => messagesController.create(req, res, next))
);
router.get(
  "/",
  authMiddleware,
  validateNumberQuery("chatId", true),
  validatePagination,
  asyncHandler((req, res, next) => messagesController.getByChatId(req, res, next))
);
router.patch("/:id", authMiddleware, validateIdParam(), asyncHandler((req, res, next) => messagesController.markAsRead(req, res, next)));

export default router;
