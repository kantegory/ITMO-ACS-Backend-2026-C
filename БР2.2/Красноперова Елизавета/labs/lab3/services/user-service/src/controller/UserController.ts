import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";

const users = () => AppDataSource.getRepository(User);

const serviceToken = () =>
    process.env.SERVICE_TOKEN || "internal-service-token";

const recipeUrl = () =>
    process.env.RECIPE_SERVICE_URL || "http://localhost:3002";

const socialUrl = () =>
    process.env.SOCIAL_SERVICE_URL || "http://localhost:3003";

async function callJson(
    base: string,
    path: string,
    opts: any = {}
) {
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

export class UserController {

    
    static getProfile = async (
        req: AuthRequest,
        res: Response
    ) => {
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


    
    static updateProfile = async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const {
                username,
                email,
                bio,
                avatar_url
            } = req.body;

            await users().update(
                req.userId!,
                {
                    username,
                    email,
                    bio,
                    avatar_url
                }
            );

            const user = await users().findOne({
                where: {
                    user_id: req.userId
                }
            });

            return res.json({
                user_id: user!.user_id,
                username: user!.username,
                email: user!.email,
                avatar_url: user!.avatar_url,
                bio: user!.bio,
                created_at: user!.created_at,
                role: user!.role
            });

        } catch {
            return res.status(409).json({
                error: {
                    code: "CONFLICT",
                    message: "Email или username занят"
                }
            });
        }
    };


    
    static myRecipes = async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const recipes = await callJson(
                recipeUrl(),
                `/internal/recipes/by-author/${req.userId}`
            );

            return res.json(recipes);

        } catch {
            return res.status(503).json({
                error: {
                    code: "SERVICE_UNAVAILABLE",
                    message: "RecipeService недоступен"
                }
            });
        }
    };


    
    static savedRecipes = async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const saved = await callJson(
                socialUrl(),
                `/internal/users/${req.userId}/saved`
            );

            const recipeIds = Array.isArray(saved?.recipe_ids) ? saved.recipe_ids : [];
            if (!recipeIds.length) {
                return res.json({ items: [], total: 0, page: 1, limit: 20 });
            }

            const recipes = await callJson(
                recipeUrl(),
                "/internal/recipes/by-ids",
                { method: "POST", body: JSON.stringify({ recipe_ids: recipeIds }) }
            );

            return res.json(recipes);
        } catch {
            return res.status(503).json({
                error: {
                    code: "SERVICE_UNAVAILABLE",
                    message: "Зависимый сервис недоступен"
                }
            });
        }
    };


    
    static getPublicProfile = async (
        req: Request,
        res: Response
    ) => {
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



    static internalGet = async (
        req: Request,
        res: Response
    ) => {
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


    
    static internalExists = async (
        req: Request,
        res: Response
    ) => {
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
}