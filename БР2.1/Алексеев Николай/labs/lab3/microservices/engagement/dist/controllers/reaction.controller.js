"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionController = void 0;
const data_source_1 = require("../config/data-source");
const Reaction_1 = require("../entities/Reaction");
const connection_1 = require("../rabbitmq/connection");
class ReactionController {
    constructor() {
        this.reactionRepository = data_source_1.AppDataSource.getRepository(Reaction_1.Reaction);
        this.commentRepository = data_source_1.AppDataSource.getRepository('Comment');
        this.saveRepository = data_source_1.AppDataSource.getRepository('SavedRecipe');
        // Поставить реакцию (лайк или дизлайк)
        this.react = async (req, res) => {
            try {
                const userId = req.user.userId;
                const recipeId = parseInt(req.params.id);
                const { type } = req.body; // 'like' или 'dislike'
                if (!Object.values(Reaction_1.ReactionType).includes(type)) {
                    return res.status(400).json({ code: 400, message: 'Invalid reaction type' });
                }
                // Проверяем существование рецепта
                const recipeResponse = await fetch(`${process.env.RECIPE_SERVICE_URL}/api/recipes/internal/recipes/${recipeId}`, {
                    headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                });
                if (recipeResponse.status === 404) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                // Ищем существующую реакцию пользователя
                const existingReaction = await this.reactionRepository.findOne({
                    where: { userId, recipeId },
                });
                // Если реакция уже такая же — ошибка
                if (existingReaction && existingReaction.type === type) {
                    return res.status(409).json({
                        code: 409,
                        message: `Already ${type === Reaction_1.ReactionType.LIKE ? 'liked' : 'disliked'}`,
                    });
                }
                let eventType;
                let oppositeEventType;
                if (type === Reaction_1.ReactionType.LIKE) {
                    eventType = connection_1.EVENT_TYPES.RECIPE_LIKED;
                    oppositeEventType = connection_1.EVENT_TYPES.RECIPE_DISLIKED;
                }
                else {
                    eventType = connection_1.EVENT_TYPES.RECIPE_DISLIKED;
                    oppositeEventType = connection_1.EVENT_TYPES.RECIPE_LIKED;
                }
                if (existingReaction) {
                    // Меняем реакцию (был дизлайк → лайк или наоборот)
                    existingReaction.type = type;
                    await this.reactionRepository.save(existingReaction);
                    // Отправляем события: удаляем старую реакцию, добавляем новую
                    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, oppositeEventType, {
                        recipeId,
                        userId,
                        timestamp: new Date().toISOString(),
                    });
                    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, eventType, {
                        recipeId,
                        userId,
                        timestamp: new Date().toISOString(),
                    });
                }
                else {
                    // Новая реакция
                    const reaction = this.reactionRepository.create({ userId, recipeId, type });
                    await this.reactionRepository.save(reaction);
                    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, eventType, {
                        recipeId,
                        userId,
                        timestamp: new Date().toISOString(),
                    });
                }
                // Подсчитываем статистику
                const likes = await this.reactionRepository.countBy({
                    recipeId,
                    type: Reaction_1.ReactionType.LIKE,
                });
                const dislikes = await this.reactionRepository.countBy({
                    recipeId,
                    type: Reaction_1.ReactionType.DISLIKE,
                });
                res.json({ likes, dislikes });
            }
            catch (error) {
                console.error('Reaction error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        // Удалить реакцию
        this.removeReaction = async (req, res) => {
            try {
                const userId = req.user.userId;
                const recipeId = parseInt(req.params.id);
                const existingReaction = await this.reactionRepository.findOne({
                    where: { userId, recipeId },
                });
                if (!existingReaction) {
                    return res.status(404).json({ code: 404, message: 'Reaction not found' });
                }
                const eventType = existingReaction.type === Reaction_1.ReactionType.LIKE
                    ? connection_1.EVENT_TYPES.RECIPE_UNLIKED
                    : connection_1.EVENT_TYPES.RECIPE_UNDISLIKED;
                await this.reactionRepository.delete({ userId, recipeId });
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, eventType, {
                    recipeId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
                const likes = await this.reactionRepository.countBy({
                    recipeId,
                    type: Reaction_1.ReactionType.LIKE,
                });
                const dislikes = await this.reactionRepository.countBy({
                    recipeId,
                    type: Reaction_1.ReactionType.DISLIKE,
                });
                res.json({ likes, dislikes });
            }
            catch (error) {
                console.error('Remove reaction error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        // Получить лайкнутые рецепты пользователя
        this.getLikedRecipes = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { page = 1, limit = 20 } = req.query;
                const [reactions, total] = await this.reactionRepository.findAndCount({
                    where: { userId, type: Reaction_1.ReactionType.LIKE },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit),
                    order: { createdAt: 'DESC' },
                });
                res.json({
                    items: reactions,
                    total,
                    page: Number(page),
                    limit: Number(limit),
                });
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        // Получить дизлайкнутые рецепты пользователя
        this.getDislikedRecipes = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { page = 1, limit = 20 } = req.query;
                const [reactions, total] = await this.reactionRepository.findAndCount({
                    where: { userId, type: Reaction_1.ReactionType.DISLIKE },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit),
                    order: { createdAt: 'DESC' },
                });
                res.json({
                    items: reactions,
                    total,
                    page: Number(page),
                    limit: Number(limit),
                });
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        // Получить статистику рецепта (для Internal API)
        this.getCounters = async (req, res) => {
            try {
                const serviceToken = req.headers['x-service-token'];
                if (serviceToken !== process.env.INTERNAL_TOKEN) {
                    return res.status(401).json({ code: 401, message: 'Unauthorized' });
                }
                const recipeId = parseInt(req.params.id);
                const [likes, dislikes, comments, saves] = await Promise.all([
                    this.reactionRepository.countBy({ recipeId, type: Reaction_1.ReactionType.LIKE }),
                    this.reactionRepository.countBy({ recipeId, type: Reaction_1.ReactionType.DISLIKE }),
                    this.commentRepository.countBy({ recipeId }),
                    this.saveRepository.countBy({ recipeId }),
                ]);
                res.json({ likes, dislikes, comments, saves });
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.ReactionController = ReactionController;
