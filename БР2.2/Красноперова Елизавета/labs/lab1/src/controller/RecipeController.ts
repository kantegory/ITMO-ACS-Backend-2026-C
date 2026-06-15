import { Response } from "express";
import { AppDataSource } from "../index";
import { Recipe } from "../entity/Recipe";
import { Like } from "../entity/Like";
import { SavedRecipe } from "../entity/SavedRecipe";
import { AuthRequest } from "../middleware/auth";

const recipeRepository = () => AppDataSource.getRepository(Recipe);
const likeRepository = () => AppDataSource.getRepository(Like);
const savedRepository = () => AppDataSource.getRepository(SavedRecipe);

export class RecipeController {

    
    static getAll = async (req: AuthRequest, res: Response) => {
        try {
            const { search, dish_type, difficulty, min_time, max_time, ingredients, sort_by, page = 1, limit = 20 } = req.query;

            
            const countQb = recipeRepository().createQueryBuilder("r")
                .leftJoin("r.author", "author")
                .leftJoin("r.likes", "likes")
                .where("r.is_published = :is_published", { is_published: true });

            if (search) countQb.andWhere("(r.title ILIKE :search OR r.description ILIKE :search)", { search: `%${search}%` });
            if (dish_type) countQb.andWhere("r.dish_type = :dish_type", { dish_type });
            if (difficulty) countQb.andWhere("r.difficulty = :difficulty", { difficulty });
            if (min_time) countQb.andWhere("r.cooking_time_min >= :min_time", { min_time: +min_time });
            if (max_time) countQb.andWhere("r.cooking_time_min <= :max_time", { max_time: +max_time });

            if (ingredients) {
                const ingredientIds = (ingredients as string).split(",").map(Number);
                countQb.innerJoin("r.recipeIngredients", "ri")
                    .andWhere("ri.ingredient_id IN (:...ingredientIds)", { ingredientIds })
                    .groupBy("r.recipe_id, author.user_id")
                    .having("COUNT(DISTINCT ri.ingredient_id) = :count", { count: ingredientIds.length });
            }

            const total = await countQb.getCount();

            
            const dataQb = recipeRepository().createQueryBuilder("r")
                .leftJoinAndSelect("r.author", "author")
                .leftJoin("r.likes", "likes")
                .addSelect("COUNT(likes.like_id)", "likes_count")
                .where("r.is_published = :is_published", { is_published: true })
                .groupBy("r.recipe_id, author.user_id");

            if (search) dataQb.andWhere("(r.title ILIKE :search OR r.description ILIKE :search)", { search: `%${search}%` });
            if (dish_type) dataQb.andWhere("r.dish_type = :dish_type", { dish_type });
            if (difficulty) dataQb.andWhere("r.difficulty = :difficulty", { difficulty });
            if (min_time) dataQb.andWhere("r.cooking_time_min >= :min_time", { min_time: +min_time });
            if (max_time) dataQb.andWhere("r.cooking_time_min <= :max_time", { max_time: +max_time });

            if (ingredients) {
                const ingredientIds = (ingredients as string).split(",").map(Number);
                dataQb.innerJoin("r.recipeIngredients", "ri")
                    .andWhere("ri.ingredient_id IN (:...ingredientIds)", { ingredientIds })
                    .groupBy("r.recipe_id, author.user_id")
                    .having("COUNT(DISTINCT ri.ingredient_id) = :count", { count: ingredientIds.length });
            }

            
            if (sort_by === "likes_count") {
                dataQb.orderBy("likes_count", "DESC");
            } else if (sort_by === "cooking_time_min") {
                dataQb.orderBy("r.cooking_time_min", "ASC");
            } else if (sort_by === "difficulty") {
                dataQb.orderBy("r.difficulty", "ASC");
            } else {
                dataQb.orderBy("r.published_at", "DESC");
            }

            
            dataQb.skip((+page - 1) * +limit).take(+limit);

            const rawResult = await dataQb.getRawAndEntities();

            
            const result = rawResult.raw.map((raw: any, index: number) => ({
                recipe_id: rawResult.entities[index].recipe_id,
                title: rawResult.entities[index].title,
                photo_main_url: rawResult.entities[index].photo_main_url,
                cooking_time_min: rawResult.entities[index].cooking_time_min,
                difficulty: rawResult.entities[index].difficulty,
                dish_type: rawResult.entities[index].dish_type,
                likes_count: parseInt(raw.likes_count) || 0,
                author: {
                    user_id: rawResult.entities[index].author.user_id,
                    username: rawResult.entities[index].author.username,
                    avatar_url: rawResult.entities[index].author.avatar_url,
                    bio: rawResult.entities[index].author.bio
                },
                published_at: rawResult.entities[index].published_at
            }));

            return res.json({ items: result, total, page: +page, limit: +limit });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка запроса" } });
        }
    };

    
    static getOne = async (req: AuthRequest, res: Response) => {
        try {
            const recipe = await recipeRepository().findOne({
                where: { recipe_id: +req.params.recipe_id },
                relations: ["author", "steps", "recipeIngredients", "recipeIngredients.ingredient", "likes", "comments"]
            });

            if (!recipe) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });

            let isLiked = false, isSaved = false;
            if (req.userId) {
                isLiked = !!(await likeRepository().findOne({ where: { user_id: req.userId, recipe_id: recipe.recipe_id } }));
                isSaved = !!(await savedRepository().findOne({ where: { user_id: req.userId, recipe_id: recipe.recipe_id } }));
            }

            return res.json({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                photo_main_url: recipe.photo_main_url,
                video_url: recipe.video_url,
                cooking_time_min: recipe.cooking_time_min,
                difficulty: recipe.difficulty,
                dish_type: recipe.dish_type,
                steps: recipe.steps?.sort((a, b) => a.step_number - b.step_number).map(s => ({
                    step_id: s.step_id,
                    step_number: s.step_number,
                    instruction_text: s.instruction_text,
                    photo_url: s.photo_url
                })),
                ingredients: recipe.recipeIngredients?.map(ri => ({
                    ingredient_id: ri.ingredient.ingredient_id,
                    name: ri.ingredient.name,
                    category: ri.ingredient.category,
                    quantity: ri.quantity
                })),
                likes_count: recipe.likes?.length || 0,
                comments_count: recipe.comments?.length || 0,
                is_liked_by_me: isLiked,
                is_saved_by_me: isSaved,
                author: {
                    user_id: recipe.author.user_id,
                    username: recipe.author.username,
                    avatar_url: recipe.author.avatar_url,
                    bio: recipe.author.bio
                },
                published_at: recipe.published_at
            });
        } catch (error) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
        }
    };

   
    static create = async (req: AuthRequest, res: Response) => {
        try {
            const { title, description, photo_main_url, video_url, cooking_time_min, difficulty, dish_type, steps, ingredients } = req.body;
            const recipe = recipeRepository().create({
                title, description, photo_main_url, video_url,
                cooking_time_min, difficulty, dish_type,
                author_id: req.userId!,
                steps: steps || [],
                recipeIngredients: (ingredients || []).map((ing: any) => ({
                    ingredient_id: ing.ingredient_id,
                    quantity: ing.quantity
                }))
            });
            await recipeRepository().save(recipe);
            return res.status(201).json({ message: "Рецепт создан", recipe_id: recipe.recipe_id });
        } catch (error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка создания рецепта" } });
        }
    };

    
    static update = async (req: AuthRequest, res: Response) => {
        try {
            const recipe = await recipeRepository().findOne({ where: { recipe_id: +req.params.recipe_id } });
            if (!recipe) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
            if (recipe.author_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой рецепт" } });

            await recipeRepository().update(+req.params.recipe_id, req.body);
            return res.json({ message: "Рецепт обновлён" });
        } catch (error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка обновления" } });
        }
    };

    
    static delete = async (req: AuthRequest, res: Response) => {
        try {
            const recipe = await recipeRepository().findOne({ where: { recipe_id: +req.params.recipe_id } });
            if (!recipe) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Рецепт не найден" } });
            if (recipe.author_id !== req.userId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Чужой рецепт" } });

            await recipeRepository().delete(+req.params.recipe_id);
            return res.json({ message: "Рецепт удалён" });
        } catch (error) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка удаления" } });
        }
    };
}