import { Router } from "express";
import { RecipeController } from "../controller/RecipeController";
import {
    authMiddleware,
    serviceAuth
} from "../middleware/auth";

const r = Router();


r.get(
    "/api/recipes",
    RecipeController.getAll
);


r.get(
    "/api/recipes/mine",
    authMiddleware,
    RecipeController.getMine
);


r.get(
    "/api/recipes/:recipe_id",
    RecipeController.getOne
);


r.post(
    "/api/recipes",
    authMiddleware,
    RecipeController.create
);


r.put(
    "/api/recipes/:recipe_id",
    authMiddleware,
    RecipeController.update
);


r.delete(
    "/api/recipes/:recipe_id",
    authMiddleware,
    RecipeController.delete
);




r.get(
    "/internal/recipes/:recipe_id",
    serviceAuth,
    RecipeController.internalGet
);


r.get(
    "/internal/recipes/:recipe_id/exists",
    serviceAuth,
    RecipeController.internalExists
);


r.get(
    "/internal/recipes/by-author/:user_id",
    serviceAuth,
    RecipeController.internalByAuthor
);


r.post(
    "/internal/recipes/by-ids",
    serviceAuth,
    RecipeController.internalByIds
);

r.get(
    "/internal/recipes/:recipe_id/social-stats",
    serviceAuth,
    RecipeController.internalSocialStats
);

export default r;