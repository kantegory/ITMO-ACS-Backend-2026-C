"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const index_1 = require("../index");
const User_1 = require("../entity/User");
const Recipe_1 = require("../entity/Recipe");
const SavedRecipe_1 = require("../entity/SavedRecipe");
const userRepository = () => index_1.AppDataSource.getRepository(User_1.User);
const recipeRepository = () => index_1.AppDataSource.getRepository(Recipe_1.Recipe);
const savedRepository = () => index_1.AppDataSource.getRepository(SavedRecipe_1.SavedRecipe);
class UserController {
}
exports.UserController = UserController;
_a = UserController;
UserController.getProfile = async (req, res) => {
    const user = await userRepository().findOne({ where: { user_id: req.userId } });
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
        await userRepository().update(req.userId, {
            username,
            email,
            bio,
            avatar_url
        });
        const user = await userRepository().findOne({
            where: { user_id: req.userId }
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
    catch (error) {
        return res.status(409).json({
            error: {
                code: "CONFLICT",
                message: "Email или username занят"
            }
        });
    }
};
UserController.myRecipes = async (req, res) => {
    const [items, total] = await recipeRepository().findAndCount({
        where: { author_id: req.userId },
        relations: ["author", "likes"],
        order: { published_at: "DESC" }
    });
    return res.json({ items, total, page: 1, limit: 20 });
};
UserController.savedRecipes = async (req, res) => {
    const saved = await savedRepository().find({
        where: { user_id: req.userId },
        relations: ["recipe", "recipe.author", "recipe.likes"]
    });
    const items = saved.map(s => {
        var _b;
        return ({
            recipe_id: s.recipe.recipe_id,
            title: s.recipe.title,
            photo_main_url: s.recipe.photo_main_url,
            cooking_time_min: s.recipe.cooking_time_min,
            difficulty: s.recipe.difficulty,
            dish_type: s.recipe.dish_type,
            likes_count: ((_b = s.recipe.likes) === null || _b === void 0 ? void 0 : _b.length) || 0,
            author: {
                user_id: s.recipe.author.user_id,
                username: s.recipe.author.username,
                avatar_url: s.recipe.author.avatar_url,
                bio: s.recipe.author.bio
            },
            published_at: s.recipe.published_at
        });
    });
    return res.json({ items, total: items.length, page: 1, limit: 20 });
};
UserController.getPublicProfile = async (req, res) => {
    const user = await userRepository().findOne({ where: { user_id: +req.params.user_id } });
    if (!user)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Пользователь не найден" } });
    return res.json({
        user_id: user.user_id,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio
    });
};
