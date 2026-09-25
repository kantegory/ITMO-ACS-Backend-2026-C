import { Request, Response } from "express";
import { AppDataSource } from "../index";
import { Like } from "../entity/Like";
import { SavedRecipe } from "../entity/SavedRecipe";
import { Comment } from "../entity/Comment";
import { Subscription } from "../entity/Subscription";
import { AuthRequest } from "../middleware/auth";
import { publishEvent } from "../messaging/rabbit";

const likes = () => AppDataSource.getRepository(Like);
const saved = () => AppDataSource.getRepository(SavedRecipe);
const comments = () => AppDataSource.getRepository(Comment);
const subs = () => AppDataSource.getRepository(Subscription);
const token = () => process.env.SERVICE_TOKEN || "internal-service-token";
const userUrl = () => process.env.USER_SERVICE_URL || "http://localhost:3001";
const recipeUrl = () => process.env.RECIPE_SERVICE_URL || "http://localhost:3002";

class ServiceError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}

async function callJson(base: string, path: string, options: RequestInit = {}) {
    let response: globalThis.Response;
    try {
        response = await fetch(base + path, {
            ...options,
            headers: { ...(options.headers || {}), "x-service-token": token(), "content-type": "application/json" }
        });
    } catch {
        throw new ServiceError(503, "SERVICE_UNAVAILABLE", "Зависимый сервис недоступен");
    }
    let body: any = null;
    try { body = await response.json(); } catch { /* empty */ }
    if (!response.ok) {
        throw new ServiceError(response.status, body?.error?.code || "DEPENDENCY_ERROR", body?.error?.message || "Ошибка зависимого сервиса");
    }
    return body;
}

async function validateUser(userId: number) {
    await callJson(userUrl(), `/internal/users/${userId}/exists`);
}

async function validateRecipe(recipeId: number) {
    await callJson(recipeUrl(), `/internal/recipes/${recipeId}/exists`);
}

async function publishSocialUpdate(recipeId: number) {
    const [likesCount, commentsCount, savedCount] = await Promise.all([
        likes().count({ where: { recipe_id: recipeId } }),
        comments().count({ where: { recipe_id: recipeId } }),
        saved().count({ where: { recipe_id: recipeId } })
    ]);
    await publishEvent("recipe.social.updated", {
        type: "recipe.social.updated",
        recipe_id: recipeId,
        likes_count: likesCount,
        comments_count: commentsCount,
        saved_count: savedCount
    });
}

function sendError(res: Response, error: any) {
    if (error instanceof ServiceError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    console.error(error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервиса" } });
}

export class SocialController {
    static like = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateUser(req.userId!);
            await validateRecipe(recipeId);
            const existing = await likes().findOne({ where: { user_id: req.userId, recipe_id: recipeId } });
            if (existing) return res.status(409).json({ error: { code: "ALREADY_LIKED", message: "Рецепт уже отмечен пользователем" } });
            await likes().save({ user_id: req.userId!, recipe_id: recipeId });
            await publishSocialUpdate(recipeId);
            return res.json({ recipe_id: recipeId, user_id: req.userId, liked: true });
        } catch (error) { return sendError(res, error); }
    };

    static unlike = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateRecipe(recipeId);
            await likes().delete({ user_id: req.userId, recipe_id: recipeId });
            const count = await likes().count({ where: { recipe_id: recipeId } });
            await publishSocialUpdate(recipeId);
            return res.json({ message: "Лайк убран", likes_count: count });
        } catch (error) { return sendError(res, error); }
    };

    static save = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateUser(req.userId!);
            await validateRecipe(recipeId);
            const existing = await saved().findOne({ where: { user_id: req.userId, recipe_id: recipeId } });
            if (existing) return res.status(409).json({ error: { code: "ALREADY_SAVED", message: "Рецепт уже сохранён" } });
            await saved().save({ user_id: req.userId!, recipe_id: recipeId });
            await publishSocialUpdate(recipeId);
            return res.json({ message: "Рецепт сохранён" });
        } catch (error) { return sendError(res, error); }
    };

    static unsave = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateRecipe(recipeId);
            await saved().delete({ user_id: req.userId, recipe_id: recipeId });
            await publishSocialUpdate(recipeId);
            return res.json({ message: "Рецепт удалён из сохранённых" });
        } catch (error) { return sendError(res, error); }
    };

    static getComments = async (req: Request, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateRecipe(recipeId);
            const [items, total] = await comments().findAndCount({ where: { recipe_id: recipeId }, order: { created_at: "ASC" } });
            const result = await Promise.all(items.map(async comment => {
                let author: any = { user_id: comment.user_id };
                try { author = await callJson(userUrl(), `/internal/users/${comment.user_id}`); } catch (error) {
                    if (!(error instanceof ServiceError) || error.status !== 404) throw error;
                }
                return { comment_id: comment.comment_id, content: comment.content, parent_comment_id: comment.parent_comment_id, author, created_at: comment.created_at };
            }));
            return res.json({ items: result, total, page: 1, limit: 20 });
        } catch (error) { return sendError(res, error); }
    };

    static addComment = async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            await validateUser(req.userId!);
            await validateRecipe(recipeId);
            if (!req.body.content || !String(req.body.content).trim()) return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Комментарий не может быть пустым" } });
            if (req.body.parent_comment_id) {
                const parent = await comments().findOne({ where: { comment_id: Number(req.body.parent_comment_id), recipe_id: recipeId } });
                if (!parent) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Родительский комментарий не найден" } });
            }
            const comment = comments().create({ content: String(req.body.content).trim(), user_id: req.userId!, recipe_id: recipeId, parent_comment_id: req.body.parent_comment_id ? Number(req.body.parent_comment_id) : null });
            await comments().save(comment);
            await publishSocialUpdate(recipeId);
            return res.status(201).json({ message: "Комментарий создан", comment_id: comment.comment_id });
        } catch (error) { return sendError(res, error); }
    };

    static updateComment = async (req: AuthRequest, res: Response) => {
        try {
            const comment = await comments().findOne({ where: { comment_id: Number(req.params.comment_id) } });
            if (!comment) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
            if (comment.user_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
            if (!req.body.content || !String(req.body.content).trim()) return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Комментарий не может быть пустым" } });
            comment.content = String(req.body.content).trim();
            await comments().save(comment);
            return res.json({ message: "Комментарий обновлён" });
        } catch (error) { return sendError(res, error); }
    };

    static deleteComment = async (req: AuthRequest, res: Response) => {
        try {
            const comment = await comments().findOne({ where: { comment_id: Number(req.params.comment_id) } });
            if (!comment) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
            if (comment.user_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
            await comments().delete(comment.comment_id);
            await publishSocialUpdate(comment.recipe_id);
            return res.json({ message: "Комментарий удалён" });
        } catch (error) { return sendError(res, error); }
    };

    static subscribe = async (req: AuthRequest, res: Response) => {
        try {
            const followedId = Number(req.params.user_id);
            if (req.userId === followedId) return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Нельзя подписаться на себя" } });
            await validateUser(req.userId!);
            await validateUser(followedId);
            const existing = await subs().findOne({ where: { follower_id: req.userId, followed_id: followedId } });
            if (existing) return res.status(409).json({ error: { code: "CONFLICT", message: "Уже подписаны" } });
            await subs().save({ follower_id: req.userId!, followed_id: followedId });
            return res.json({ message: "Подписка оформлена" });
        } catch (error) { return sendError(res, error); }
    };

    static unsubscribe = async (req: AuthRequest, res: Response) => {
        try {
            const followedId = Number(req.params.user_id);
            await validateUser(followedId);
            await subs().delete({ follower_id: req.userId, followed_id: followedId });
            return res.json({ message: "Отписка выполнена" });
        } catch (error) { return sendError(res, error); }
    };

    static getSubscriptions = async (req: AuthRequest, res: Response) => {
        try {
            const rows = await subs().find({ where: { follower_id: req.userId } });
            const items = await Promise.all(rows.map(row => callJson(userUrl(), `/internal/users/${row.followed_id}`)));
            return res.json({ items, total: items.length, page: 1, limit: 20 });
        } catch (error) { return sendError(res, error); }
    };

    static getSubscribers = async (req: AuthRequest, res: Response) => {
        try {
            const rows = await subs().find({ where: { followed_id: req.userId } });
            const items = await Promise.all(rows.map(row => callJson(userUrl(), `/internal/users/${row.follower_id}`)));
            return res.json({ items, total: items.length, page: 1, limit: 20 });
        } catch (error) { return sendError(res, error); }
    };

    static summary = async (req: Request, res: Response) => {
        const recipeId = Number(req.params.recipe_id);
        const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
        const likesCount = await likes().count({ where: { recipe_id: recipeId } });
        const commentsCount = await comments().count({ where: { recipe_id: recipeId } });
        const isLikedByMe = userId ? !!(await likes().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false;
        const isSavedByMe = userId ? !!(await saved().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false;
        return res.json({ recipe_id: recipeId, likes_count: likesCount, comments_count: commentsCount, is_liked_by_me: isLikedByMe, is_saved_by_me: isSavedByMe });
    };

    static summaries = async (req: Request, res: Response) => {
        const ids = Array.isArray(req.body.recipe_ids) ? req.body.recipe_ids.map(Number).filter(Number.isInteger) : [];
        const userId = req.body.user_id ? Number(req.body.user_id) : undefined;
        const items = await Promise.all(ids.map(async recipeId => ({
            recipe_id: recipeId,
            likes_count: await likes().count({ where: { recipe_id: recipeId } }),
            comments_count: await comments().count({ where: { recipe_id: recipeId } }),
            is_liked_by_me: userId ? !!(await likes().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false,
            is_saved_by_me: userId ? !!(await saved().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false
        })));
        return res.json({ items });
    };

    static internalEventState = async (req: Request, res: Response) => {
        try {
            const recipeId = Number(req.params.recipe_id);
            const [likesCount, commentsCount, savedCount] = await Promise.all([
                likes().count({ where: { recipe_id: recipeId } }),
                comments().count({ where: { recipe_id: recipeId } }),
                saved().count({ where: { recipe_id: recipeId } })
            ]);
            return res.json({ recipe_id: recipeId, likes_count: likesCount, comments_count: commentsCount, saved_count: savedCount });
        } catch (error) {
            return sendError(res, error);
        }
    };

    static internalSaved = async (req: Request, res: Response) => {
        try {
            const rows = await saved().find({ where: { user_id: Number(req.params.user_id) }, order: { saved_at: "DESC" } });
            const ids = rows.map(row => row.recipe_id);
            return res.json({ recipe_ids: ids });
        } catch (error) { return sendError(res, error); }
    };
}
