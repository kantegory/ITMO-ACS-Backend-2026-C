import { Router } from "express";
import { RecipeController } from "../controller/RecipeController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.get("/", RecipeController.getAll);
router.get("/:recipe_id", RecipeController.getOne);
router.post("/", authMiddleware, RecipeController.create);
router.put("/:recipe_id", authMiddleware, RecipeController.update);
router.delete("/:recipe_id", authMiddleware, RecipeController.delete);
export default router;