import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { User } from "../entity/User";
import { Recipe } from "../entity/Recipe";
import { SavedRecipe } from "../entity/SavedRecipe";
import { AuthRequest } from "../middleware/auth";

const userRepository = () => AppDataSource.getRepository(User);
const recipeRepository = () => AppDataSource.getRepository(Recipe);
const savedRepository = () => AppDataSource.getRepository(SavedRecipe);

export class UserController {
    static getProfile = async (req: AuthRequest, res: Response) => {
        const user = await userRepository().findOne({ where: { user_id: req.userId } });
        return res.json({
            user_id: user!.user_id,
            username: user!.username,
            email: user!.email,
            avatar_url: user!.avatar_url,
            bio: user!.bio,
            created_at: user!.created_at,
            role: user!.role
        });
    };

    static updateProfile = async (req: AuthRequest, res: Response) => {
        try {
            await userRepository().update(req.userId!, req.body);
            const user = await userRepository().findOne({ where: { user_id: req.userId } });
            return res.json({
                user_id: user!.user_id,
                username: user!.username,
                email: user!.email,
                avatar_url: user!.avatar_url,
                bio: user!.bio,
                created_at: user!.created_at,
                role: user!.role
            });
        } catch (error) {
            return res.status(409).json({ error: { code: "CONFLICT", message: "Email или username занят" } });
        }
    };

    static myRecipes = async (req: AuthRequest, res: Response) => {
        const [items, total] = await recipeRepository().findAndCount({
            where: { author_id: req.userId },
            relations: ["author", "likes"],
            order: { published_at: "DESC" }
        });
        return res.json({ items, total, page: 1, limit: 20 });
    };

    static savedRecipes = async (req: AuthRequest, res: Response) => {
        const saved = await savedRepository().find({
            where: { user_id: req.userId },
            relations: ["recipe", "recipe.author", "recipe.likes"]
        });
        const items = saved.map(s => ({
            recipe_id: s.recipe.recipe_id,
            title: s.recipe.title,
            photo_main_url: s.recipe.photo_main_url,
            cooking_time_min: s.recipe.cooking_time_min,
            difficulty: s.recipe.difficulty,
            dish_type: s.recipe.dish_type,
            likes_count: s.recipe.likes?.length || 0,
            author: {
                user_id: s.recipe.author.user_id,
                username: s.recipe.author.username,
                avatar_url: s.recipe.author.avatar_url,
                bio: s.recipe.author.bio
            },
            published_at: s.recipe.published_at
        }));
        return res.json({ items, total: items.length, page: 1, limit: 20 });
    };

    static getPublicProfile = async (req: Request, res: Response) => {
        const user = await userRepository().findOne({ where: { user_id: +req.params.user_id } });
        if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Пользователь не найден" } });
        return res.json({
            user_id: user.user_id,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio
        });
    };
}