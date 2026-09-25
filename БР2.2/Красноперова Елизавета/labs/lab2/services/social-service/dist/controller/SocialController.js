"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialController = void 0;
const index_1 = require("../index");
const Like_1 = require("../entity/Like");
const SavedRecipe_1 = require("../entity/SavedRecipe");
const Comment_1 = require("../entity/Comment");
const Subscription_1 = require("../entity/Subscription");
const likes = () => index_1.AppDataSource.getRepository(Like_1.Like);
const saved = () => index_1.AppDataSource.getRepository(SavedRecipe_1.SavedRecipe);
const comments = () => index_1.AppDataSource.getRepository(Comment_1.Comment);
const subs = () => index_1.AppDataSource.getRepository(Subscription_1.Subscription);
const token = () => process.env.SERVICE_TOKEN || "internal-service-token";
const userUrl = () => process.env.USER_SERVICE_URL || "http://localhost:3001";
const recipeUrl = () => process.env.RECIPE_SERVICE_URL || "http://localhost:3002";
class ServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
async function callJson(base, path, options = {}) {
    var _b, _c;
    let response;
    try {
        response = await fetch(base + path, {
            ...options,
            headers: { ...(options.headers || {}), "x-service-token": token(), "content-type": "application/json" }
        });
    }
    catch (_d) {
        throw new ServiceError(503, "SERVICE_UNAVAILABLE", "Зависимый сервис недоступен");
    }
    let body = null;
    try {
        body = await response.json();
    }
    catch ( /* empty */_e) { /* empty */ }
    if (!response.ok) {
        throw new ServiceError(response.status, ((_b = body === null || body === void 0 ? void 0 : body.error) === null || _b === void 0 ? void 0 : _b.code) || "DEPENDENCY_ERROR", ((_c = body === null || body === void 0 ? void 0 : body.error) === null || _c === void 0 ? void 0 : _c.message) || "Ошибка зависимого сервиса");
    }
    return body;
}
async function validateUser(userId) {
    await callJson(userUrl(), `/internal/users/${userId}/exists`);
}
async function validateRecipe(recipeId) {
    await callJson(recipeUrl(), `/internal/recipes/${recipeId}/exists`);
}
function sendError(res, error) {
    if (error instanceof ServiceError)
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    console.error(error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервиса" } });
}
class SocialController {
}
exports.SocialController = SocialController;
_a = SocialController;
SocialController.like = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateUser(req.userId);
        await validateRecipe(recipeId);
        const existing = await likes().findOne({ where: { user_id: req.userId, recipe_id: recipeId } });
        if (existing)
            return res.status(409).json({ error: { code: "ALREADY_LIKED", message: "Рецепт уже отмечен пользователем" } });
        await likes().save({ user_id: req.userId, recipe_id: recipeId });
        return res.json({ recipe_id: recipeId, user_id: req.userId, liked: true });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.unlike = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateRecipe(recipeId);
        await likes().delete({ user_id: req.userId, recipe_id: recipeId });
        const count = await likes().count({ where: { recipe_id: recipeId } });
        return res.json({ message: "Лайк убран", likes_count: count });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.save = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateUser(req.userId);
        await validateRecipe(recipeId);
        const existing = await saved().findOne({ where: { user_id: req.userId, recipe_id: recipeId } });
        if (existing)
            return res.status(409).json({ error: { code: "ALREADY_SAVED", message: "Рецепт уже сохранён" } });
        await saved().save({ user_id: req.userId, recipe_id: recipeId });
        return res.json({ message: "Рецепт сохранён" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.unsave = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateRecipe(recipeId);
        await saved().delete({ user_id: req.userId, recipe_id: recipeId });
        return res.json({ message: "Рецепт удалён из сохранённых" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.getComments = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateRecipe(recipeId);
        const [items, total] = await comments().findAndCount({ where: { recipe_id: recipeId }, order: { created_at: "ASC" } });
        const result = await Promise.all(items.map(async (comment) => {
            let author = { user_id: comment.user_id };
            try {
                author = await callJson(userUrl(), `/internal/users/${comment.user_id}`);
            }
            catch (error) {
                if (!(error instanceof ServiceError) || error.status !== 404)
                    throw error;
            }
            return { comment_id: comment.comment_id, content: comment.content, parent_comment_id: comment.parent_comment_id, author, created_at: comment.created_at };
        }));
        return res.json({ items: result, total, page: 1, limit: 20 });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.addComment = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipe_id);
        await validateUser(req.userId);
        await validateRecipe(recipeId);
        if (!req.body.content || !String(req.body.content).trim())
            return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Комментарий не может быть пустым" } });
        if (req.body.parent_comment_id) {
            const parent = await comments().findOne({ where: { comment_id: Number(req.body.parent_comment_id), recipe_id: recipeId } });
            if (!parent)
                return res.status(404).json({ error: { code: "NOT_FOUND", message: "Родительский комментарий не найден" } });
        }
        const comment = comments().create({ content: String(req.body.content).trim(), user_id: req.userId, recipe_id: recipeId, parent_comment_id: req.body.parent_comment_id ? Number(req.body.parent_comment_id) : null });
        await comments().save(comment);
        return res.status(201).json({ message: "Комментарий создан", comment_id: comment.comment_id });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.updateComment = async (req, res) => {
    try {
        const comment = await comments().findOne({ where: { comment_id: Number(req.params.comment_id) } });
        if (!comment)
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
        if (comment.user_id !== req.userId)
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
        if (!req.body.content || !String(req.body.content).trim())
            return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Комментарий не может быть пустым" } });
        comment.content = String(req.body.content).trim();
        await comments().save(comment);
        return res.json({ message: "Комментарий обновлён" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.deleteComment = async (req, res) => {
    try {
        const comment = await comments().findOne({ where: { comment_id: Number(req.params.comment_id) } });
        if (!comment)
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
        if (comment.user_id !== req.userId)
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
        await comments().delete(comment.comment_id);
        return res.json({ message: "Комментарий удалён" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.subscribe = async (req, res) => {
    try {
        const followedId = Number(req.params.user_id);
        if (req.userId === followedId)
            return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Нельзя подписаться на себя" } });
        await validateUser(req.userId);
        await validateUser(followedId);
        const existing = await subs().findOne({ where: { follower_id: req.userId, followed_id: followedId } });
        if (existing)
            return res.status(409).json({ error: { code: "CONFLICT", message: "Уже подписаны" } });
        await subs().save({ follower_id: req.userId, followed_id: followedId });
        return res.json({ message: "Подписка оформлена" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.unsubscribe = async (req, res) => {
    try {
        const followedId = Number(req.params.user_id);
        await validateUser(followedId);
        await subs().delete({ follower_id: req.userId, followed_id: followedId });
        return res.json({ message: "Отписка выполнена" });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.getSubscriptions = async (req, res) => {
    try {
        const rows = await subs().find({ where: { follower_id: req.userId } });
        const items = await Promise.all(rows.map(row => callJson(userUrl(), `/internal/users/${row.followed_id}`)));
        return res.json({ items, total: items.length, page: 1, limit: 20 });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.getSubscribers = async (req, res) => {
    try {
        const rows = await subs().find({ where: { followed_id: req.userId } });
        const items = await Promise.all(rows.map(row => callJson(userUrl(), `/internal/users/${row.follower_id}`)));
        return res.json({ items, total: items.length, page: 1, limit: 20 });
    }
    catch (error) {
        return sendError(res, error);
    }
};
SocialController.summary = async (req, res) => {
    const recipeId = Number(req.params.recipe_id);
    const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
    const likesCount = await likes().count({ where: { recipe_id: recipeId } });
    const commentsCount = await comments().count({ where: { recipe_id: recipeId } });
    const isLikedByMe = userId ? !!(await likes().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false;
    const isSavedByMe = userId ? !!(await saved().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false;
    return res.json({ recipe_id: recipeId, likes_count: likesCount, comments_count: commentsCount, is_liked_by_me: isLikedByMe, is_saved_by_me: isSavedByMe });
};
SocialController.summaries = async (req, res) => {
    const ids = Array.isArray(req.body.recipe_ids) ? req.body.recipe_ids.map(Number).filter(Number.isInteger) : [];
    const userId = req.body.user_id ? Number(req.body.user_id) : undefined;
    const items = await Promise.all(ids.map(async (recipeId) => ({
        recipe_id: recipeId,
        likes_count: await likes().count({ where: { recipe_id: recipeId } }),
        comments_count: await comments().count({ where: { recipe_id: recipeId } }),
        is_liked_by_me: userId ? !!(await likes().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false,
        is_saved_by_me: userId ? !!(await saved().findOne({ where: { user_id: userId, recipe_id: recipeId } })) : false
    })));
    return res.json({ items });
};
SocialController.internalSaved = async (req, res) => {
    try {
        const rows = await saved().find({ where: { user_id: Number(req.params.user_id) }, order: { saved_at: "DESC" } });
        const ids = rows.map(row => row.recipe_id);
        return res.json({ recipe_ids: ids });
    }
    catch (error) {
        return sendError(res, error);
    }
};
