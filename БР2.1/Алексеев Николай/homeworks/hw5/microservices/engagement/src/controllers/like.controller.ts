import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Like } from '../entities/Like';
import { Dislike } from '../entities/Dislike';
import { publishEvent, EXCHANGES, EVENT_TYPES } from '../rabbitmq/connection';

export class LikeController {
  private likeRepository = AppDataSource.getRepository(Like);
  private dislikeRepository = AppDataSource.getRepository(Dislike);
  private commentRepository = AppDataSource.getRepository('Comment');
  private saveRepository = AppDataSource.getRepository('SavedRecipe');

  like = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      const recipeResponse = await fetch(
        `${process.env.RECIPE_SERVICE_URL}/api/recipes/internal/recipes/${recipeId}`,
        {
          headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN! },
        }
      );

      if (recipeResponse.status === 404) {
        return res.status(404).json({ code: 404, message: 'Recipe not found' });
      }

      const existingLike = await this.likeRepository.findOne({
        where: { userId, recipeId },
      });

      if (existingLike) {
        return res.status(409).json({ code: 409, message: 'Already liked' });
      }

      const existingDislike = await this.dislikeRepository.findOne({
        where: { userId, recipeId },
      });

      if (existingDislike) {
        await this.dislikeRepository.delete(existingDislike.id);
      }

      const like = this.likeRepository.create({ userId, recipeId });
      await this.likeRepository.save(like);

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_LIKED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      const likes = await this.likeRepository.countBy({ recipeId });
      const dislikes = await this.dislikeRepository.countBy({ recipeId });

      res.json({ likes, dislikes });
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  unlike = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      await this.likeRepository.delete({ userId, recipeId });

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_UNLIKED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      const likes = await this.likeRepository.countBy({ recipeId });
      const dislikes = await this.dislikeRepository.countBy({ recipeId });

      res.json({ likes, dislikes });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  dislike = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      const recipeResponse = await fetch(
        `${process.env.RECIPE_SERVICE_URL}/internal/recipes/${recipeId}`,
        {
          headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN! },
        }
      );

      if (recipeResponse.status === 404) {
        return res.status(404).json({ code: 404, message: 'Recipe not found' });
      }

      const existingDislike = await this.dislikeRepository.findOne({
        where: { userId, recipeId },
      });

      if (existingDislike) {
        return res.status(409).json({ code: 409, message: 'Already disliked' });
      }

      const existingLike = await this.likeRepository.findOne({
        where: { userId, recipeId },
      });

      if (existingLike) {
        await this.likeRepository.delete(existingLike.id);
      }

      const dislike = this.dislikeRepository.create({ userId, recipeId });
      await this.dislikeRepository.save(dislike);

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_DISLIKED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      const likes = await this.likeRepository.countBy({ recipeId });
      const dislikes = await this.dislikeRepository.countBy({ recipeId });

      res.json({ likes, dislikes });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  undislike = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      await this.dislikeRepository.delete({ userId, recipeId });

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_UNDISLIKED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      const likes = await this.likeRepository.countBy({ recipeId });
      const dislikes = await this.dislikeRepository.countBy({ recipeId });

      res.json({ likes, dislikes });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  getLikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const [likes, total] = await this.likeRepository.findAndCount({
        where: { userId },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' },
      });

      res.json({
        items: likes,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  getDislikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const [dislikes, total] = await this.dislikeRepository.findAndCount({
        where: { userId },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' },
      });

      res.json({
        items: dislikes,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  getCounters = async (req: AuthRequest, res: Response) => {
    try {
      const serviceToken = req.headers['x-service-token'];
      if (serviceToken !== process.env.INTERNAL_TOKEN) {
        return res.status(401).json({ code: 401, message: 'Unauthorized' });
      }

      const recipeId = parseInt(req.params.id as string);
      const [likes, dislikes, comments, saves] = await Promise.all([
        this.likeRepository.countBy({ recipeId }),
        this.dislikeRepository.countBy({ recipeId }),
        this.commentRepository.countBy({ recipeId }),
        this.saveRepository.countBy({ recipeId }),
      ]);

      res.json({ likes, dislikes, comments, saves });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };
}