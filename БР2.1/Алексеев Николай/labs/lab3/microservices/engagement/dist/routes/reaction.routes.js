"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const reaction_controller_1 = require("../controllers/reaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const reactionController = new reaction_controller_1.ReactionController();
// POST /api/recipes/:id/react - с телом { "type": "like" } или { "type": "dislike" }
router.post('/:id/react', auth_middleware_1.authMiddleware, [(0, express_validator_1.param)('id').isInt().toInt(), (0, express_validator_1.body)('type').isIn(['like', 'dislike'])], reactionController.react);
// DELETE /api/recipes/:id/react - удалить реакцию
router.delete('/:id/react', auth_middleware_1.authMiddleware, [(0, express_validator_1.param)('id').isInt().toInt()], reactionController.removeReaction);
// GET /api/users/me/likes
router.get('/me/likes', auth_middleware_1.authMiddleware, reactionController.getLikedRecipes);
// GET /api/users/me/dislikes
router.get('/me/dislikes', auth_middleware_1.authMiddleware, reactionController.getDislikedRecipes);
// Internal
router.get('/internal/recipes/:id/counters', reactionController.getCounters);
exports.default = router;
