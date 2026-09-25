"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const index_1 = require("../index");
const User_1 = require("../entity/User");
const users = () => index_1.AppDataSource.getRepository(User_1.User);
const serviceToken = () => process.env.SERVICE_TOKEN || "internal-service-token";
const recipeUrl = () => process.env.RECIPE_SERVICE_URL || "http://localhost:3002";
const socialUrl = () => process.env.SOCIAL_SERVICE_URL || "http://localhost:3003";
async function callJson(base, path, opts = {}) {
    const response = await fetch(base + path, {
        ...opts,
        headers: {
            ...(opts.headers || {}),
            "x-service-token": serviceToken(),
            "content-type": "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(`SERVICE_${response.status}`);
    }
    return response.json();
}
class UserController {
}
exports.UserController = UserController;
_a = UserController;
UserController.getProfile = async (req, res) => {
    const user = await users().findOne({
        where: {
            user_id: req.userId
        }
    });
    if (!user) {
        return res.status(404).json({
            error: {
                code: "NOT_FOUND",
                message: "Пользователь не найден"
            }
        });
    }
    return res.json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
        role: user.role
    });
};
UserController.updateProfile = async (req, res) => {
    try {
        const { username, email, bio, avatar_url } = req.body;
        await users().update(req.userId, {
            username,
            email,
            bio,
            avatar_url
        });
        const user = await users().findOne({
            where: {
                user_id: req.userId
            }
        });
        return res.json({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            bio: user.bio,
            created_at: user.created_at,
            role: user.role
        });
    }
    catch (_b) {
        return res.status(409).json({
            error: {
                code: "CONFLICT",
                message: "Email или username занят"
            }
        });
    }
};
UserController.myRecipes = async (req, res) => {
    try {
        const recipes = await callJson(recipeUrl(), `/internal/recipes/by-author/${req.userId}`);
        return res.json(recipes);
    }
    catch (_b) {
        return res.status(503).json({
            error: {
                code: "SERVICE_UNAVAILABLE",
                message: "RecipeService недоступен"
            }
        });
    }
};
UserController.savedRecipes = async (req, res) => {
    try {
        const saved = await callJson(socialUrl(), `/internal/users/${req.userId}/saved`);
        const recipeIds = Array.isArray(saved === null || saved === void 0 ? void 0 : saved.recipe_ids) ? saved.recipe_ids : [];
        if (!recipeIds.length) {
            return res.json({ items: [], total: 0, page: 1, limit: 20 });
        }
        const recipes = await callJson(recipeUrl(), "/internal/recipes/by-ids", { method: "POST", body: JSON.stringify({ recipe_ids: recipeIds }) });
        return res.json(recipes);
    }
    catch (_b) {
        return res.status(503).json({
            error: {
                code: "SERVICE_UNAVAILABLE",
                message: "Зависимый сервис недоступен"
            }
        });
    }
};
UserController.getPublicProfile = async (req, res) => {
    const user = await users().findOne({
        where: {
            user_id: Number(req.params.user_id)
        }
    });
    if (!user) {
        return res.status(404).json({
            error: {
                code: "NOT_FOUND",
                message: "Пользователь не найден"
            }
        });
    }
    return res.json({
        user_id: user.user_id,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio
    });
};
UserController.internalGet = async (req, res) => {
    const user = await users().findOne({
        where: {
            user_id: Number(req.params.user_id)
        }
    });
    if (!user) {
        return res.status(404).json({
            error: {
                code: "USER_NOT_FOUND",
                message: "Пользователь не найден"
            }
        });
    }
    return res.json({
        user_id: user.user_id,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio
    });
};
UserController.internalExists = async (req, res) => {
    const userId = Number(req.params.user_id);
    const exists = await users().exist({
        where: {
            user_id: userId
        }
    });
    return res.json({
        user_id: userId,
        exists
    });
};
