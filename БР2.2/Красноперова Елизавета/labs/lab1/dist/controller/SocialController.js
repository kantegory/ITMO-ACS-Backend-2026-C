"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialController = void 0;
const index_1 = require("../index");
const Like_1 = require("../entity/Like");
const SavedRecipe_1 = require("../entity/SavedRecipe");
const Comment_1 = require("../entity/Comment");
const Subscription_1 = require("../entity/Subscription");
const Recipe_1 = require("../entity/Recipe");
const User_1 = require("../entity/User");
const likeRepository = () => index_1.AppDataSource.getRepository(Like_1.Like);
const savedRepository = () => index_1.AppDataSource.getRepository(SavedRecipe_1.SavedRecipe);
const commentRepository = () => index_1.AppDataSource.getRepository(Comment_1.Comment);
const subscriptionRepository = () => index_1.AppDataSource.getRepository(Subscription_1.Subscription);
const recipeRepository = () => index_1.AppDataSource.getRepository(Recipe_1.Recipe);
const userRepository = () => index_1.AppDataSource.getRepository(User_1.User);
class SocialController {
}
exports.SocialController = SocialController;
_a = SocialController;
SocialController.like = async (req, res) => {
    const recipe = await recipeRepository().findOne({ where: { recipe_id: +req.params.recipe_id } });
    if (!recipe)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
    const existing = await likeRepository().findOne({ where: { user_id: req.userId, recipe_id: +req.params.recipe_id } });
    if (existing)
        return res.status(409).json({ error: { code: "CONFLICT", message: "Уже лайкнут" } });
    await likeRepository().save({ user_id: req.userId, recipe_id: +req.params.recipe_id });
    const count = await likeRepository().count({ where: { recipe_id: +req.params.recipe_id } });
    return res.json({ message: "Лайк поставлен", likes_count: count });
};
SocialController.unlike = async (req, res) => {
    await likeRepository().delete({ user_id: req.userId, recipe_id: +req.params.recipe_id });
    const count = await likeRepository().count({ where: { recipe_id: +req.params.recipe_id } });
    return res.json({ message: "Лайк убран", likes_count: count });
};
SocialController.save = async (req, res) => {
    const recipe = await recipeRepository().findOne({ where: { recipe_id: +req.params.recipe_id } });
    if (!recipe)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
    const existing = await savedRepository().findOne({ where: { user_id: req.userId, recipe_id: +req.params.recipe_id } });
    if (existing)
        return res.status(409).json({ error: { code: "CONFLICT", message: "Уже сохранён" } });
    await savedRepository().save({ user_id: req.userId, recipe_id: +req.params.recipe_id });
    return res.json({ message: "Рецепт сохранён" });
};
SocialController.unsave = async (req, res) => {
    await savedRepository().delete({ user_id: req.userId, recipe_id: +req.params.recipe_id });
    return res.json({ message: "Рецепт удалён из сохранённых" });
};
SocialController.getComments = async (req, res) => {
    const [items, total] = await commentRepository().findAndCount({
        where: { recipe_id: +req.params.recipe_id },
        relations: ["user"],
        order: { created_at: "ASC" }
    });
    const result = items.map(c => ({
        comment_id: c.comment_id,
        content: c.content,
        parent_comment_id: c.parent_comment_id,
        author: {
            user_id: c.user.user_id,
            username: c.user.username,
            avatar_url: c.user.avatar_url,
            bio: c.user.bio
        },
        created_at: c.created_at
    }));
    return res.json({ items: result, total, page: 1, limit: 20 });
};
SocialController.addComment = async (req, res) => {
    const comment = commentRepository().create({
        content: req.body.content,
        user_id: req.userId,
        recipe_id: +req.params.recipe_id,
        parent_comment_id: req.body.parent_comment_id || null
    });
    await commentRepository().save(comment);
    return res.status(201).json({ message: "Комментарий создан", comment_id: comment.comment_id });
};
SocialController.updateComment = async (req, res) => {
    const comment = await commentRepository().findOne({ where: { comment_id: +req.params.comment_id } });
    if (!comment)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
    if (comment.user_id !== req.userId)
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
    comment.content = req.body.content;
    await commentRepository().save(comment);
    return res.json({ message: "Комментарий обновлён" });
};
SocialController.deleteComment = async (req, res) => {
    const comment = await commentRepository().findOne({ where: { comment_id: +req.params.comment_id } });
    if (!comment)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Комментарий не найден" } });
    if (comment.user_id !== req.userId)
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой комментарий" } });
    await commentRepository().delete(+req.params.comment_id);
    return res.json({ message: "Комментарий удалён" });
};
SocialController.subscribe = async (req, res) => {
    if (req.userId === +req.params.user_id)
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Нельзя подписаться на себя" } });
    const user = await userRepository().findOne({ where: { user_id: +req.params.user_id } });
    if (!user)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Пользователь не найден" } });
    const existing = await subscriptionRepository().findOne({ where: { follower_id: req.userId, followed_id: +req.params.user_id } });
    if (existing)
        return res.status(409).json({ error: { code: "CONFLICT", message: "Уже подписаны" } });
    await subscriptionRepository().save({ follower_id: req.userId, followed_id: +req.params.user_id });
    return res.json({ message: "Подписка оформлена" });
};
SocialController.unsubscribe = async (req, res) => {
    await subscriptionRepository().delete({ follower_id: req.userId, followed_id: +req.params.user_id });
    return res.json({ message: "Отписка выполнена" });
};
SocialController.getSubscriptions = async (req, res) => {
    const subs = await subscriptionRepository().find({
        where: { follower_id: req.userId },
        relations: ["followed"]
    });
    return res.json({ items: subs.map(s => ({
            user_id: s.followed.user_id,
            username: s.followed.username,
            avatar_url: s.followed.avatar_url,
            bio: s.followed.bio
        })), total: subs.length, page: 1, limit: 20 });
};
SocialController.getSubscribers = async (req, res) => {
    const subs = await subscriptionRepository().find({
        where: { followed_id: req.userId },
        relations: ["follower"]
    });
    return res.json({ items: subs.map(s => ({
            user_id: s.follower.user_id,
            username: s.follower.username,
            avatar_url: s.follower.avatar_url,
            bio: s.follower.bio
        })), total: subs.length, page: 1, limit: 20 });
};
