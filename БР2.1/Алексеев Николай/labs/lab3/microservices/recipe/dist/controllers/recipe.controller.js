"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeController = void 0;
const data_source_1 = require("../config/data-source");
const Recipe_1 = require("../entities/Recipe");
const Step_1 = require("../entities/Step");
const Ingredient_1 = require("../entities/Ingredient");
const Cuisine_1 = require("../entities/Cuisine");
const TypeRecipe_1 = require("../entities/TypeRecipe");
const connection_1 = require("../rabbitmq/connection");
class RecipeController {
    constructor() {
        this.recipeRepository = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        this.stepRepository = data_source_1.AppDataSource.getRepository(Step_1.Step);
        this.ingredientRepository = data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient);
        this.cuisineRepository = data_source_1.AppDataSource.getRepository(Cuisine_1.Cuisine);
        this.typeRepository = data_source_1.AppDataSource.getRepository(TypeRecipe_1.TypeRecipe);
        this.list = async (req, res) => {
            try {
                const typeId = req.query.typeId ? parseInt(req.query.typeId) : undefined;
                const cuisineId = req.query.cuisineId ? parseInt(req.query.cuisineId) : undefined;
                const search = req.query.search || undefined;
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 20;
                const queryBuilder = this.recipeRepository
                    .createQueryBuilder('recipe')
                    .where('recipe.isPublished = :published', { published: true });
                if (search) {
                    queryBuilder.andWhere('recipe.title ILIKE :search', { search: `%${search}%` });
                }
                if (typeId) {
                    queryBuilder.andWhere('recipe.typeId = :typeId', { typeId });
                }
                if (cuisineId) {
                    queryBuilder.andWhere('recipe.cuisineId = :cuisineId', { cuisineId });
                }
                const [recipes, total] = await queryBuilder
                    .skip((page - 1) * limit)
                    .take(limit)
                    .orderBy('recipe.createdAt', 'DESC')
                    .getManyAndCount();
                const recipeWithCounters = await Promise.all(recipes.map(async (recipe) => {
                    try {
                        const response = await fetch(`${process.env.ENGAGEMENT_SERVICE_URL}/internal/recipes/${recipe.id}/counters`, {
                            headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                        });
                        const counters = await response.json();
                        return {
                            recipeId: recipe.id,
                            authorId: recipe.authorId,
                            typeId: recipe.typeId,
                            cuisineId: recipe.cuisineId,
                            title: recipe.title,
                            description: recipe.description,
                            imageUrl: recipe.imageUrl,
                            cookTime: recipe.cookTime,
                            createdAt: recipe.createdAt,
                            likes: counters.likes,
                            dislikes: counters.dislikes,
                            saves: counters.saves,
                        };
                    }
                    catch {
                        return {
                            recipeId: recipe.id,
                            authorId: recipe.authorId,
                            typeId: recipe.typeId,
                            cuisineId: recipe.cuisineId,
                            title: recipe.title,
                            description: recipe.description,
                            imageUrl: recipe.imageUrl,
                            cookTime: recipe.cookTime,
                            createdAt: recipe.createdAt,
                            likes: 0,
                            dislikes: 0,
                            saves: 0,
                        };
                    }
                }));
                res.json({
                    items: recipeWithCounters,
                    total,
                    page,
                    limit,
                });
            }
            catch (error) {
                console.error('List error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getById = async (req, res) => {
            try {
                const recipeId = parseInt(req.params.id);
                const recipe = await this.recipeRepository.findOne({
                    where: { id: recipeId },
                    relations: ['steps', 'ingredients'],
                });
                if (!recipe) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                let author = null;
                try {
                    const authorResponse = await fetch(`${process.env.USER_AUTH_SERVICE_URL}/internal/users/${recipe.authorId}`, {
                        headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                    });
                    if (authorResponse.ok) {
                        author = await authorResponse.json();
                    }
                }
                catch (error) {
                    console.error('Failed to fetch author:', error);
                }
                let counters = { likes: 0, dislikes: 0, comments: 0, saves: 0 };
                try {
                    const countersResponse = await fetch(`${process.env.ENGAGEMENT_SERVICE_URL}/internal/recipes/${recipe.id}/counters`, {
                        headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                    });
                    if (countersResponse.ok) {
                        counters = await countersResponse.json();
                    }
                }
                catch (error) {
                    console.error('Failed to fetch counters:', error);
                }
                res.json({
                    ...recipe,
                    author,
                    ...counters,
                });
            }
            catch (error) {
                console.error('Get by id error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.create = async (req, res) => {
            try {
                const { typeId, cuisineId, title, description, imageUrl, videoUrl, cookTime, peopleAmount, steps, ingredients, isPublished, } = req.body;
                const recipe = this.recipeRepository.create({
                    authorId: req.user.userId,
                    typeId,
                    cuisineId,
                    title,
                    description,
                    imageUrl,
                    videoUrl,
                    cookTime,
                    peopleAmount,
                    isPublished,
                });
                await this.recipeRepository.save(recipe);
                if (steps?.length) {
                    const stepEntities = steps.map((step, index) => this.stepRepository.create({
                        recipeId: recipe.id,
                        text: step.text,
                        imageUrl: step.imageUrl,
                        stepNumber: step.stepNumber || index + 1,
                    }));
                    await this.stepRepository.save(stepEntities);
                }
                if (ingredients?.length) {
                    const ingredientEntities = ingredients.map((ing) => this.ingredientRepository.create({
                        recipeId: recipe.id,
                        name: ing.name,
                        amount: ing.amount,
                        unit: ing.unit,
                    }));
                    await this.ingredientRepository.save(ingredientEntities);
                }
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_CREATED, {
                    recipeId: recipe.id,
                    authorId: req.user.userId,
                    title: recipe.title,
                    timestamp: new Date().toISOString(),
                });
                const createdRecipe = await this.recipeRepository.findOne({
                    where: { id: recipe.id },
                    relations: ['steps', 'ingredients'],
                });
                res.status(201).json(createdRecipe);
            }
            catch (error) {
                console.error('Create error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.update = async (req, res) => {
            try {
                const recipeId = parseInt(req.params.id);
                const recipe = await this.recipeRepository.findOneBy({ id: recipeId });
                if (!recipe) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                if (recipe.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
                    return res.status(403).json({ code: 403, message: 'Forbidden' });
                }
                await this.recipeRepository.update(recipe.id, req.body);
                const updatedRecipe = await this.recipeRepository.findOne({
                    where: { id: recipe.id },
                    relations: ['steps', 'ingredients'],
                });
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_UPDATED, {
                    recipeId: recipe.id,
                    title: updatedRecipe?.title,
                    timestamp: new Date().toISOString(),
                });
                res.json(updatedRecipe);
            }
            catch (error) {
                console.error('Update error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.delete = async (req, res) => {
            try {
                const recipeId = parseInt(req.params.id);
                const recipe = await this.recipeRepository.findOneBy({ id: recipeId });
                if (!recipe) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                if (recipe.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
                    return res.status(403).json({ code: 403, message: 'Forbidden' });
                }
                await this.recipeRepository.delete(recipe.id);
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_DELETED, {
                    recipeId: recipe.id,
                    timestamp: new Date().toISOString(),
                });
                res.status(204).send();
            }
            catch (error) {
                console.error('Delete error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.publish = async (req, res) => {
            try {
                const recipeId = parseInt(req.params.id);
                const recipe = await this.recipeRepository.findOneBy({ id: recipeId });
                if (!recipe) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                if (recipe.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
                    return res.status(403).json({ code: 403, message: 'Forbidden' });
                }
                recipe.isPublished = true;
                await this.recipeRepository.save(recipe);
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_PUBLISHED, {
                    recipeId: recipe.id,
                    title: recipe.title,
                    authorId: recipe.authorId,
                    timestamp: new Date().toISOString(),
                });
                res.json(recipe);
            }
            catch (error) {
                console.error('Publish error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getUserRecipes = async (req, res) => {
            try {
                const userId = req.params.userId
                    ? parseInt(req.params.userId)
                    : req.user.userId;
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 20;
                const [recipes, total] = await this.recipeRepository.findAndCount({
                    where: { authorId: userId, isPublished: true },
                    skip: (page - 1) * limit,
                    take: limit,
                    order: { createdAt: 'DESC' },
                });
                const recipeCards = recipes.map((recipe) => ({
                    recipeId: recipe.id,
                    authorId: recipe.authorId,
                    typeId: recipe.typeId,
                    cuisineId: recipe.cuisineId,
                    title: recipe.title,
                    description: recipe.description,
                    imageUrl: recipe.imageUrl,
                    cookTime: recipe.cookTime,
                    createdAt: recipe.createdAt,
                }));
                res.json({
                    items: recipeCards,
                    total,
                    page,
                    limit,
                });
            }
            catch (error) {
                console.error('Get user recipes error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.search = async (req, res) => {
            try {
                const query = req.query.q || '';
                const typeId = req.query.typeId ? parseInt(req.query.typeId) : undefined;
                const cuisineId = req.query.cuisineId ? parseInt(req.query.cuisineId) : undefined;
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 20;
                const queryBuilder = this.recipeRepository
                    .createQueryBuilder('recipe')
                    .where('recipe.isPublished = :published', { published: true });
                if (query) {
                    queryBuilder.andWhere('recipe.title ILIKE :search', { search: `%${query}%` });
                }
                if (typeId) {
                    queryBuilder.andWhere('recipe.typeId = :typeId', { typeId });
                }
                if (cuisineId) {
                    queryBuilder.andWhere('recipe.cuisineId = :cuisineId', { cuisineId });
                }
                const [recipes, total] = await queryBuilder
                    .skip((page - 1) * limit)
                    .take(limit)
                    .orderBy('recipe.createdAt', 'DESC')
                    .getManyAndCount();
                res.json({
                    items: recipes,
                    total,
                    page,
                    limit,
                });
            }
            catch (error) {
                console.error('Search error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getRecipeInternal = async (req, res) => {
            try {
                const serviceToken = req.headers['x-service-token'];
                if (serviceToken !== process.env.INTERNAL_TOKEN) {
                    return res.status(401).json({ code: 401, message: 'Unauthorized' });
                }
                const recipeId = parseInt(req.params.id);
                const recipe = await this.recipeRepository.findOne({
                    where: { id: recipeId },
                    select: ['id', 'title', 'authorId', 'isPublished'],
                });
                if (!recipe) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                res.json(recipe);
            }
            catch (error) {
                console.error('Get recipe internal error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.validateRecipes = async (req, res) => {
            try {
                const serviceToken = req.headers['x-service-token'];
                if (serviceToken !== process.env.INTERNAL_TOKEN) {
                    return res.status(401).json({ code: 401, message: 'Unauthorized' });
                }
                const { recipeIds } = req.body;
                const existing = await this.recipeRepository
                    .createQueryBuilder('recipe')
                    .where('recipe.id IN (:...recipeIds)', { recipeIds })
                    .select(['recipe.id'])
                    .getMany();
                const existingIds = existing.map((r) => r.id);
                const missing = recipeIds.filter((id) => !existingIds.includes(id));
                res.json({ existing: existingIds, missing });
            }
            catch (error) {
                console.error('Validate recipes error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.RecipeController = RecipeController;
