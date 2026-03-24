import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Recipe } from '../entities/Recipe';
import { Step } from '../entities/Step';
import { Ingredient } from '../entities/Ingredient';

export class RecipeController {
  private recipeRepository = AppDataSource.getRepository(Recipe);
  private stepRepository = AppDataSource.getRepository(Step);
  private ingredientRepository = AppDataSource.getRepository(Ingredient);

  list = async (req: AuthRequest, res: Response) => {
    try {
      const {
        ingredients,
        typeId,
        cuisineId,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const queryBuilder = this.recipeRepository
        .createQueryBuilder('recipe')
        .leftJoinAndSelect('recipe.ingredients', 'ingredients')
        .leftJoinAndSelect('recipe.author', 'author')
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

      if (ingredients) {
        const ingredientNames = Array.isArray(ingredients) ? ingredients : [ingredients];
        queryBuilder.andWhere('ingredients.name IN (:...ingredientNames)', { ingredientNames });
      }

      const [recipes, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('recipe.createdAt', 'DESC')
        .getManyAndCount();

      const recipeCards = recipes.map(recipe => ({
        recipeId: recipe.id,
        authorId: recipe.authorId,
        typeId: recipe.typeId,
        cuisineId: recipe.cuisineId,
        title: recipe.title,
        desc: recipe.desc,
        imageUrl: recipe.imageUrl,
        cookTime: recipe.cookTime,
        createdAt: recipe.createdAt,
        ingredients: recipe.ingredients,
        likes: recipe.likes,
        dislikes: recipe.dislikes,
        saves: recipe.saves
      }));

      res.json({
        items: recipeCards,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('List recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: Number(req.params.recipeId) },
        relations: ['steps', 'ingredients', 'comments', 'comments.user', 'author', 'cuisine', 'type']
      });

      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      res.json(recipe);
    } catch (error) {
      console.error('Get recipe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const {
        typeId,
        cuisineId,
        title,
        desc,
        imageUrl,
        videoUrl,
        cookTime,
        peopleAmount,
        steps,
        ingredients,
        isPublished
      } = req.body;

      const recipe = this.recipeRepository.create({
        authorId: req.user!.id,
        typeId,
        cuisineId,
        title,
        desc,
        imageUrl,
        videoUrl,
        cookTime,
        peopleAmount,
        isPublished
      });

      await this.recipeRepository.save(recipe);

      if (steps && steps.length) {
        const stepEntities = steps.map((step: any, index: number) =>
          this.stepRepository.create({
            recipeId: recipe.id,
            text: step.text,
            imageUrl: step.imageUrl,
            number: step.number || index + 1
          })
        );
        await this.stepRepository.save(stepEntities);
      }

      if (ingredients && ingredients.length) {
        const ingredientEntities = ingredients.map((ing: any) =>
          this.ingredientRepository.create({
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit
          })
        );
        await this.ingredientRepository.save(ingredientEntities);
      }

      const createdRecipe = await this.recipeRepository.findOne({
        where: { id: recipe.id },
        relations: ['steps', 'ingredients']
      });

      res.status(201).json(createdRecipe);
    } catch (error) {
      console.error('Create recipe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: Number(req.params.recipeId) }
      });

      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      if (recipe.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden: You do not have permission'
        });
      }

      await this.recipeRepository.update(recipe.id, req.body);
      const updatedRecipe = await this.recipeRepository.findOne({
        where: { id: recipe.id },
        relations: ['steps', 'ingredients']
      });

      res.json(updatedRecipe);
    } catch (error) {
      console.error('Update recipe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: Number(req.params.recipeId) }
      });

      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      if (recipe.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden: You do not have permission'
        });
      }

      await this.recipeRepository.delete(recipe.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete recipe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  publish = async (req: AuthRequest, res: Response) => {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: Number(req.params.recipeId) }
      });

      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      if (recipe.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden: You do not have permission'
        });
      }

      recipe.isPublished = true;
      await this.recipeRepository.save(recipe);

      res.json(recipe);
    } catch (error) {
      console.error('Publish recipe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };
}