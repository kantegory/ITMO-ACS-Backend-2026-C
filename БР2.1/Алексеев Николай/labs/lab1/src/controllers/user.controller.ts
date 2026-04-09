import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Recipe } from '../entities/Recipe';
import { Subscription } from '../entities/Subscription';
import { SavedRecipe } from '../entities/SavedRecipe';
import { Like } from '../entities/Like';
import { Dislike } from '../entities/Dislike';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private recipeRepository = AppDataSource.getRepository(Recipe);
  private subscriptionRepository = AppDataSource.getRepository(Subscription);
  private savedRepository = AppDataSource.getRepository(SavedRecipe);
  private likeRepository = AppDataSource.getRepository(Like);
  private dislikeRepository = AppDataSource.getRepository(Dislike);

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  updateMe = async (req: AuthRequest, res: Response) => {
    try {
      const { password, ...updateData } = req.body;

      if (password) {
        return res.status(400).json({
          code: 400,
          message: 'Password cannot be updated here'
        });
      }

      await this.userRepository.update(req.user!.id, updateData);
      const updatedUser = await this.userRepository.findOneBy({ id: req.user!.id });

      const { password: _, ...userWithoutPassword } = updatedUser!;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update me error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getUserById = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: Number(req.params.userId) },
        relations: ['recipes']
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getUserRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const [recipes, total] = await this.recipeRepository.findAndCount({
        where: { authorId: Number(userId), isPublished: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

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
      console.error('Get user recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getMyRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [recipes, total] = await this.recipeRepository.findAndCount({
        where: { authorId: req.user!.id },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

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
      console.error('Get my recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getMySubscriptions = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [subscriptions, total] = await this.subscriptionRepository.findAndCount({
        where: { followerId: req.user!.id },
        relations: ['author'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

      res.json({
        items: subscriptions,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getMySavedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [saved, total] = await this.savedRepository.findAndCount({
        where: { userId: req.user!.id },
        relations: ['recipe', 'recipe.author'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

      const savedRecipes = saved.map(s => ({
        ...s.recipe,
        id: s.id,
        userId: s.userId,
        recipeId: s.recipeId,
        createdAt: s.createdAt,
      }));

      res.json({
        items: savedRecipes,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Get saved recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getMyLikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [likes, total] = await this.likeRepository.findAndCount({
        where: { userId: req.user!.id },
        relations: ['recipe', 'recipe.author'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

      const likedRecipes = likes.map(like => ({
        ...like.recipe,
        id: like.id,
        userId: like.userId,
        recipeId: like.recipeId,
        createdAt: like.createdAt,
        type: 'LIKE'
      }));

      res.json({
        items: likedRecipes,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Get liked recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  getMyDislikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [dislikes, total] = await this.dislikeRepository.findAndCount({
        where: { userId: req.user!.id },
        relations: ['recipe', 'recipe.author'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

      const dislikedRecipes = dislikes.map(dislike => ({
        ...dislike.recipe,
        id: dislike.id,
        userId: dislike.userId,
        recipeId: dislike.recipeId,
        createdAt: dislike.createdAt,
        type: 'DISLIKE'
      }));

      res.json({
        items: dislikedRecipes,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Get disliked recipes error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  subscribe = async (req: AuthRequest, res: Response) => {
    try {
      const { authorId } = req.params;

      if (Number(authorId) === req.user!.id) {
        return res.status(400).json({
          code: 400,
          message: 'Cannot subscribe to yourself'
        });
      }

      const author = await this.userRepository.findOneBy({ id: Number(authorId) });
      if (!author) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const existing = await this.subscriptionRepository.findOneBy({
        followerId: req.user!.id,
        authorId: Number(authorId)
      });

      if (existing) {
        return res.status(409).json({
          code: 409,
          message: 'Conflict: Duplicate resource or constraint violation'
        });
      }

      const subscription = this.subscriptionRepository.create({
        followerId: req.user!.id,
        authorId: Number(authorId)
      });

      await this.subscriptionRepository.save(subscription);

      res.status(201).json(subscription);
    } catch (error) {
      console.error('Subscribe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  unsubscribe = async (req: AuthRequest, res: Response) => {
    try {
      const { authorId } = req.params;

      const subscription = await this.subscriptionRepository.findOneBy({
        followerId: req.user!.id,
        authorId: Number(authorId)
      });

      if (subscription) {
        await this.subscriptionRepository.delete(subscription.id);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };
}