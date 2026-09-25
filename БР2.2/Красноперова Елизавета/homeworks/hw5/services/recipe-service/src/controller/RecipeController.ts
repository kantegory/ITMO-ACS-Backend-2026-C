import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { Recipe } from "../entity/Recipe";
import { AuthRequest } from "../middleware/auth";
import { publishEvent } from "../messaging/rabbit";
import { RecipeSocialStats } from "../entity/RecipeSocialStats";

const recipes = () => AppDataSource.getRepository(Recipe);
const token = () => process.env.SERVICE_TOKEN || "internal-service-token";
const userUrl = () => process.env.USER_SERVICE_URL || "http://localhost:3001";
const socialUrl = () => process.env.SOCIAL_SERVICE_URL || "http://localhost:3003";

class DependencyError extends Error {
    constructor(public status: number, public code: string, message: string) {
        super(message);
        this.name = "DependencyError";
    }
}

async function callJson(base: string, path: string, options: RequestInit = {}) {
    let response: globalThis.Response;
    try {
        response = await fetch(base + path, {
            ...options,
            headers: {
                ...(options.headers || {}),
                "x-service-token": token(),
                "content-type": "application/json"
            }
        });
    } catch {
        throw new DependencyError(503, "SERVICE_UNAVAILABLE", "Зависимый сервис недоступен");
    }

    let data: any = null;
    try { data = await response.json(); } catch { /* empty */ }

    if (!response.ok) {
        throw new DependencyError(
            response.status,
            data?.error?.code || data?.code || "DEPENDENCY_ERROR",
            data?.error?.message || data?.message || "Ошибка зависимого сервиса"
        );
    }
    return data;
}

function parsePositiveInt(value: unknown, fallback: number) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
}

function applyRecipeFilters(qb: any, query: any) {
    const { search, dish_type, difficulty, min_time, max_time, ingredients } = query;

    qb.andWhere("r.is_published = :isPublished", { isPublished: true });

    if (search) {
        qb.andWhere("(r.title ILIKE :search OR r.description ILIKE :search)", {
            search: `%${String(search)}%`
        });
    }
    if (dish_type) qb.andWhere("r.dish_type = :dishType", { dishType: String(dish_type) });
    if (difficulty) qb.andWhere("r.difficulty = :difficulty", { difficulty: String(difficulty) });

    if (min_time !== undefined && min_time !== "") {
        const value = Number(min_time);
        if (!Number.isFinite(value)) throw new Error("INVALID_MIN_TIME");
        qb.andWhere("r.cooking_time_min >= :minTime", { minTime: value });
    }

    if (max_time !== undefined && max_time !== "") {
        const value = Number(max_time);
        if (!Number.isFinite(value)) throw new Error("INVALID_MAX_TIME");
        qb.andWhere("r.cooking_time_min <= :maxTime", { maxTime: value });
    }

    if (ingredients) {
        const ingredientIds = String(ingredients)
            .split(",")
            .map(Number)
            .filter(Number.isInteger);

        if (!ingredientIds.length) throw new Error("INVALID_INGREDIENTS");

        qb.andWhere(
            `r.recipe_id IN (
                SELECT ri.recipe_id
                FROM recipe_ingredients ri
                WHERE ri.ingredient_id IN (:...ingredientIds)
                GROUP BY ri.recipe_id
                HAVING COUNT(DISTINCT ri.ingredient_id) = :ingredientCount
            )`,
            { ingredientIds, ingredientCount: ingredientIds.length }
        );
    }
}

async function getSocialSummaries(recipeIds: number[]) {
    if (!recipeIds.length) return [];
    try {
        const data = await callJson(socialUrl(), "/internal/recipes/summaries", {
            method: "POST",
            body: JSON.stringify({ recipe_ids: recipeIds })
        });
        return Array.isArray(data?.items) ? data.items : [];
    } catch {
        return recipeIds.map(recipe_id => ({ recipe_id, likes_count: 0 }));
    }
}

async function getAuthor(authorId: number) {
    try {
        return await callJson(userUrl(), `/internal/users/${authorId}`);
    } catch (error) {
        if (error instanceof DependencyError && error.status === 404) {
            return { user_id: authorId };
        }
        throw error;
    }
}

export class RecipeController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const page = parsePositiveInt(req.query.page, 1);
            const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
            const sortBy = String(req.query.sort_by || "published_at");

            const baseQb = recipes().createQueryBuilder("r");
            applyRecipeFilters(baseQb, req.query);
            baseQb.select([
                "r.recipe_id", "r.title", "r.description", "r.photo_main_url",
                "r.cooking_time_min", "r.difficulty", "r.dish_type",
                "r.author_id", "r.published_at"
            ]);

            const allRows = await baseQb.getMany();
            const total = allRows.length;

            const summaries = await getSocialSummaries(allRows.map(r => r.recipe_id));
            const summaryById = new Map<number, any>(summaries.map((s: any) => [Number(s.recipe_id), s]));

            if (sortBy === "likes_count") {
                allRows.sort((a, b) => {
                    const diff = Number(summaryById.get(b.recipe_id)?.likes_count || 0) - Number(summaryById.get(a.recipe_id)?.likes_count || 0);
                    return diff || (new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
                });
            } else if (sortBy === "cooking_time_min") {
                allRows.sort((a, b) => a.cooking_time_min - b.cooking_time_min);
            } else {
                allRows.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
            }

            const rows = allRows.slice((page - 1) * limit, page * limit);
            const items = await Promise.all(rows.map(async recipe => ({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                author_id: recipe.author_id,
                author: await getAuthor(recipe.author_id),
                likes_count: Number(summaryById.get(recipe.recipe_id)?.likes_count || 0),
                published_at: recipe.published_at
            })));

            return res.json({ items, total, page, limit });
        } catch (error) {
            console.error(error);
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Ошибка запроса" }
            });
        }
    };

    static getMine = async (req: AuthRequest, res: Response) => {
        try {
            const rows = await recipes().find({
                where: { author_id: req.userId! },
                order: { published_at: "DESC" }
            });
            const items = await Promise.all(rows.map(async recipe => ({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                author_id: recipe.author_id,
                author: await getAuthor(recipe.author_id),
                published_at: recipe.published_at
            })));
            return res.json({ items, total: items.length, page: 1, limit: 20 });
        } catch {
            return res.status(503).json({
                error: { code: "SERVICE_UNAVAILABLE", message: "Ошибка получения рецептов пользователя" }
            });
        }
    };

    static getOne = async (req: Request, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const recipe = await recipes().findOne({
                where: { recipe_id: recipeId },
                relations: ["steps", "recipeIngredients", "recipeIngredients.ingredient"]
            });

            if (!recipe) {
                return res.status(404).json({
                    error: { code: "NOT_FOUND", message: "Рецепт не найден" }
                });
            }

            const author = await getAuthor(recipe.author_id);
            return res.json({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                video_url: recipe.video_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                steps: (recipe.steps || [])
                    .sort((a, b) => a.step_number - b.step_number)
                    .map(s => ({
                        step_id: s.step_id,
                        step_number: s.step_number,
                        instruction_text: s.instruction_text,
                        photo_url: s.photo_url
                    })),
                ingredients: (recipe.recipeIngredients || []).map(ri => ({
                    ingredient_id: ri.ingredient_id,
                    name: ri.ingredient?.name,
                    category: ri.ingredient?.category,
                    quantity: ri.quantity
                })),
                author,
                published_at: recipe.published_at
            });
        } catch (error) {
            console.error(error);
            return res.status(503).json({
                error: { code: "SERVICE_UNAVAILABLE", message: "Ошибка получения рецепта" }
            });
        }
    };

    static create = async (req: AuthRequest, res: Response) => {
        try {
            const authorId = req.userId!;
            await callJson(userUrl(), `/internal/users/${authorId}/exists`);

            const {
                title, description, photo_main_url, video_url,
                cooking_time_min, difficulty, dish_type, steps: rawSteps,
                ingredients: rawIngredients
            } = req.body;

            const recipe = recipes().create({
                title,
                description,
                photo_main_url,
                video_url,
                cooking_time_min,
                difficulty,
                dish_type,
                author_id: authorId,
                steps: Array.isArray(rawSteps) ? rawSteps.map((step: any) => ({
                    step_number: Number(step.step_number),
                    instruction_text: String(step.instruction_text || ""),
                    photo_url: step.photo_url || null
                })) : [],
                recipeIngredients: Array.isArray(rawIngredients) ? rawIngredients.map((ingredient: any) => ({
                    ingredient_id: Number(ingredient.ingredient_id),
                    quantity: String(ingredient.quantity ?? "")
                })) : []
            });

            await recipes().save(recipe);
            await publishEvent("recipe.created", { type: "recipe.created", recipe_id: recipe.recipe_id, author_id: authorId });
            return res.status(201).json({ message: "Рецепт создан", recipe_id: recipe.recipe_id });
        } catch (error: any) {
            if (error instanceof DependencyError) {
                return res.status(error.status === 404 ? 404 : 503).json({
                    error: {
                        code: error.status === 404 ? "USER_NOT_FOUND" : "SERVICE_UNAVAILABLE",
                        message: error.status === 404 ? "Пользователь не найден" : "UserService недоступен"
                    }
                });
            }
            console.error(error);
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Ошибка создания рецепта" }
            });
        }
    };

    static update = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const recipe = await recipes().findOne({ where: { recipe_id: recipeId } });

            if (!recipe) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
            if (recipe.author_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой рецепт" } });

            const { title, description, difficulty } = req.body;
            await recipes().update(recipeId, { title, description, difficulty });
            return res.json({ message: "Рецепт обновлён" });
        } catch {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка обновления" } });
        }
    };

    static delete = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const recipe = await recipes().findOne({ where: { recipe_id: recipeId } });
            if (!recipe) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
            if (recipe.author_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой рецепт" } });
            await recipes().delete(recipeId);
            await publishEvent("recipe.deleted", { type: "recipe.deleted", recipe_id: recipeId, author_id: recipe.author_id });
            return res.json({ message: "Рецепт удалён" });
        } catch {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка удаления" } });
        }
    };

    static internalGet = async (req: Request, res: Response) => {
        try {
            const recipe = await recipes().findOne({
                where: { recipe_id: Number(req.params.recipe_id) },
                relations: ["steps", "recipeIngredients", "recipeIngredients.ingredient"]
            });
            if (!recipe) return res.status(404).json({ error: { code: "RECIPE_NOT_FOUND", message: "Рецепт не найден" } });
            return res.json(recipe);
        } catch {
            return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ошибка получения рецепта" } });
        }
    };

    static internalExists = async (req: Request, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const recipe = await recipes().findOne({ where: { recipe_id: recipeId }, select: ["recipe_id", "author_id"] });
            if (!recipe) return res.status(404).json({ error: { code: "RECIPE_NOT_FOUND", message: "Рецепт не найден" } });
            return res.json({ recipe_id: recipeId, exists: true, author_id: recipe.author_id });
        } catch {
            return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ошибка проверки рецепта" } });
        }
    };

    static internalSocialStats = async (req: Request, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const stats = await AppDataSource.getRepository(RecipeSocialStats).findOne({ where: { recipe_id: recipeId } });
            return res.json(stats || { recipe_id: recipeId, likes_count: 0, comments_count: 0, saved_count: 0 });
        } catch {
            return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ошибка получения статистики" } });
        }
    };

    static internalByAuthor = async (req: Request, res: Response) => {
        try {
            const userId = Number(req.params.user_id);
            const rows = await recipes().find({ where: { author_id: userId }, order: { published_at: "DESC" } });
            const items = await Promise.all(rows.map(async recipe => ({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                author_id: recipe.author_id,
                author: await getAuthor(recipe.author_id),
                published_at: recipe.published_at
            })));
            return res.json({ items, total: items.length, page: 1, limit: 20 });
        } catch {
            return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ошибка получения рецептов пользователя" } });
        }
    };

    static internalByIds = async (req: Request, res: Response) => {
        try {
            const ids = Array.isArray(req.body?.recipe_ids)
                ? req.body.recipe_ids.map(Number).filter(Number.isInteger)
                : [];
            if (!ids.length) return res.json({ items: [], total: 0, page: 1, limit: 20 });

            const rows = await recipes().find({
                where: ids.map(recipe_id => ({ recipe_id })),
                order: { published_at: "DESC" }
            });

            const items = await Promise.all(rows.map(async recipe => ({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                author_id: recipe.author_id,
                author: await getAuthor(recipe.author_id),
                published_at: recipe.published_at
            })));

            return res.json({ items, total: items.length, page: 1, limit: 20 });
        } catch {
            return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ошибка получения рецептов" } });
        }
    };
}
