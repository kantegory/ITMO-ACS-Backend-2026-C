"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveController = void 0;
const data_source_1 = require("../config/data-source");
const SavedRecipe_1 = require("../entities/SavedRecipe");
const connection_1 = require("../rabbitmq/connection");
class SaveController {
    constructor() {
        this.saveRepository = data_source_1.AppDataSource.getRepository(SavedRecipe_1.SavedRecipe);
        this.save = async (req, res) => {
            try {
                const userId = req.user.userId;
                const recipeId = parseInt(req.params.id);
                const recipeResponse = await fetch(`${process.env.RECIPE_SERVICE_URL}/api/recipes/internal/recipes/${recipeId}`, {
                    headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                });
                if (recipeResponse.status === 404) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                const existing = await this.saveRepository.findOne({
                    where: { userId, recipeId },
                });
                if (existing) {
                    return res.status(409).json({ code: 409, message: 'Already saved' });
                }
                const saved = this.saveRepository.create({ userId, recipeId });
                await this.saveRepository.save(saved);
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.EVENT_TYPES.RECIPE_SAVED, {
                    recipeId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
                res.status(201).json(saved);
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.unsave = async (req, res) => {
            try {
                const userId = req.user.userId;
                const recipeId = parseInt(req.params.id);
                await this.saveRepository.delete({ userId, recipeId });
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.EVENT_TYPES.RECIPE_UNSAVED, {
                    recipeId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getSavedRecipes = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { page = 1, limit = 20 } = req.query;
                const [saved, total] = await this.saveRepository.findAndCount({
                    where: { userId },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit),
                    order: { createdAt: 'DESC' },
                });
                res.json({
                    items: saved,
                    total,
                    page: Number(page),
                    limit: Number(limit),
                });
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.SaveController = SaveController;
