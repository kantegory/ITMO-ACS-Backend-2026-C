import { Router } from "express";
import { UserController } from "../controller/UserController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.get("/me", authMiddleware, UserController.getProfile);
router.put("/me", authMiddleware, UserController.updateProfile);
router.get("/me/recipes", authMiddleware, UserController.myRecipes);
router.get("/me/saved", authMiddleware, UserController.savedRecipes);
router.get("/:user_id", UserController.getPublicProfile);
export default router;