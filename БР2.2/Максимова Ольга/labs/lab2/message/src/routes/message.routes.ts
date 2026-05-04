import { Router } from "express";
import MessageController from "../controllers/message.controller";
import { authMiddleware } from "../middleware";

const router = Router();

router.get("/batch", authMiddleware, MessageController.batch);
router.get("/conversation", authMiddleware, MessageController.conversation);
router.get(
  "/accommodation/:accomId",
  authMiddleware,
  MessageController.byAccommodation,
);
router.get("/:id", authMiddleware, MessageController.getById);
router.post("/", authMiddleware, MessageController.create);
router.delete("/:id", authMiddleware, MessageController.deleteMessage);

export default router;
