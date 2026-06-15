import { Router } from "express";
import { SocialController } from "../controller/SocialController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.post("/recipes/:recipe_id/like", authMiddleware, SocialController.like);
router.delete("/recipes/:recipe_id/like", authMiddleware, SocialController.unlike);
router.post("/recipes/:recipe_id/save", authMiddleware, SocialController.save);
router.delete("/recipes/:recipe_id/save", authMiddleware, SocialController.unsave);
router.get("/recipes/:recipe_id/comments", SocialController.getComments);
router.post("/recipes/:recipe_id/comments", authMiddleware, SocialController.addComment);
router.put("/comments/:comment_id", authMiddleware, SocialController.updateComment);
router.delete("/comments/:comment_id", authMiddleware, SocialController.deleteComment);
router.post("/users/:user_id/subscribe", authMiddleware, SocialController.subscribe);
router.delete("/users/:user_id/subscribe", authMiddleware, SocialController.unsubscribe);
router.get("/users/me/subscriptions", authMiddleware, SocialController.getSubscriptions);
router.get("/users/me/subscribers", authMiddleware, SocialController.getSubscribers);
export default router;