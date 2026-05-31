"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const recipe_controller_1 = require("../controllers/recipe.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const recipeController = new recipe_controller_1.RecipeController();
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('typeId').optional().isInt().toInt(),
    (0, express_validator_1.query)('cuisineId').optional().isInt().toInt(),
], recipeController.list);
router.get('/search', recipeController.search);
router.get('/:id', [(0, express_validator_1.param)('id').isInt().toInt()], recipeController.getById);
router.post('/', auth_middleware_1.authMiddleware, recipeController.create);
router.patch('/:id', auth_middleware_1.authMiddleware, [(0, express_validator_1.param)('id').isInt().toInt()], recipeController.update);
router.delete('/:id', auth_middleware_1.authMiddleware, [(0, express_validator_1.param)('id').isInt().toInt()], recipeController.delete);
router.post('/:id/publish', auth_middleware_1.authMiddleware, [(0, express_validator_1.param)('id').isInt().toInt()], recipeController.publish);
router.get('/user/me', auth_middleware_1.authMiddleware, recipeController.getUserRecipes);
router.get('/user/:userId', recipeController.getUserRecipes);
router.get('/internal/recipes/:id', recipeController.getRecipeInternal);
router.post('/internal/recipes/validate', recipeController.validateRecipes);
exports.default = router;
