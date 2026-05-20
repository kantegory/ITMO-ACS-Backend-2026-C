import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Recipe } from '../entities/Recipe';
import { Like } from '../entities/Like';
import { Dislike } from '../entities/Dislike';
import { SavedRecipe } from '../entities/SavedRecipe';

export class InteractionController {
  private recipeRepository = AppDataSource.getRepository(Recipe);
  private likeRepository = AppDataSource.getRepository(Like);
  private dislikeRepository = AppDataSource.getRepository(Dislike);
  private savedRepository = AppDataSource.getRepository(SavedRecipe);

  like = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const existingLike = await this.likeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (existingLike) {
        return res.status(409).json({
          code: 409,
          message: 'Conflict: Duplicate resource or constraint violation'
        });
      }

      const existingDislike = await this.dislikeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (existingDislike) {
        await this.dislikeRepository.delete(existingDislike.id);
        recipe.dislikes = Math.max(0, recipe.dislikes - 1);
      }

      const like = this.likeRepository.create({ userId, recipeId: Number(recipeId) });
      await this.likeRepository.save(like);

      recipe.likes += 1;
      await this.recipeRepository.save(recipe);

      res.json({ likes: recipe.likes, dislikes: recipe.dislikes });
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  unlike = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const like = await this.likeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (like) {
        await this.likeRepository.delete(like.id);
        recipe.likes = Math.max(0, recipe.likes - 1);
        await this.recipeRepository.save(recipe);
      }

      res.json({ likes: recipe.likes, dislikes: recipe.dislikes });
    } catch (error) {
      console.error('Unlike error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  dislike = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const existingDislike = await this.dislikeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (existingDislike) {
        return res.status(409).json({
          code: 409,
          message: 'Conflict: Duplicate resource or constraint violation'
        });
      }

      const existingLike = await this.likeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (existingLike) {
        await this.likeRepository.delete(existingLike.id);
        recipe.likes = Math.max(0, recipe.likes - 1);
      }

      const dislike = this.dislikeRepository.create({ userId, recipeId: Number(recipeId) });
      await this.dislikeRepository.save(dislike);

      recipe.dislikes += 1;
      await this.recipeRepository.save(recipe);

      res.json({ likes: recipe.likes, dislikes: recipe.dislikes });
    } catch (error) {
      console.error('Dislike error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  undislike = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const dislike = await this.dislikeRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (dislike) {
        await this.dislikeRepository.delete(dislike.id);
        recipe.dislikes = Math.max(0, recipe.dislikes - 1);
        await this.recipeRepository.save(recipe);
      }

      res.json({ likes: recipe.likes, dislikes: recipe.dislikes });
    } catch (error) {
      console.error('Undislike error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  save = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const existingSave = await this.savedRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (existingSave) {
        return res.status(409).json({
          code: 409,
          message: 'Conflict: Duplicate resource or constraint violation'
        });
      }

      const saved = this.savedRepository.create({ userId, recipeId: Number(recipeId) });
      await this.savedRepository.save(saved);

      recipe.saves += 1;
      await this.recipeRepository.save(recipe);

      res.status(201).json(saved);
    } catch (error) {
      console.error('Save error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  unsave = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const userId = req.user!.id;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const saved = await this.savedRepository.findOneBy({
        userId,
        recipeId: Number(recipeId)
      });

      if (saved) {
        await this.savedRepository.delete(saved.id);
        recipe.saves = Math.max(0, recipe.saves - 1);
        await this.recipeRepository.save(recipe);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Unsave error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };
}