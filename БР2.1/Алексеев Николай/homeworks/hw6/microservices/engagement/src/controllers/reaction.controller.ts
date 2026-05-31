import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Reaction, ReactionType } from '../entities/Reaction';
import { publishEvent, EXCHANGES, EVENT_TYPES } from '../rabbitmq/connection';

export class ReactionController {
  private reactionRepository = AppDataSource.getRepository(Reaction);
  private commentRepository = AppDataSource.getRepository('Comment');
  private saveRepository = AppDataSource.getRepository('SavedRecipe');

  // Поставить реакцию (лайк или дизлайк)
  react = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);
      const { type } = req.body; // 'like' или 'dislike'

      if (!Object.values(ReactionType).includes(type)) {
        return res.status(400).json({ code: 400, message: 'Invalid reaction type' });
      }

      // Проверяем существование рецепта
      const recipeResponse = await fetch(
        `${process.env.RECIPE_SERVICE_URL}/api/recipes/internal/recipes/${recipeId}`,
        {
          headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN! },
        }
      );

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
          message: `Already ${type === ReactionType.LIKE ? 'liked' : 'disliked'}`,
        });
      }

      let eventType: string;
      let oppositeEventType: string;

      if (type === ReactionType.LIKE) {
        eventType = EVENT_TYPES.RECIPE_LIKED;
        oppositeEventType = EVENT_TYPES.RECIPE_DISLIKED;
      } else {
        eventType = EVENT_TYPES.RECIPE_DISLIKED;
        oppositeEventType = EVENT_TYPES.RECIPE_LIKED;
      }

      if (existingReaction) {
        // Меняем реакцию (был дизлайк → лайк или наоборот)
        existingReaction.type = type;
        await this.reactionRepository.save(existingReaction);

        // Отправляем события: удаляем старую реакцию, добавляем новую
        await publishEvent(EXCHANGES.ENGAGEMENT, oppositeEventType, {
          recipeId,
          userId,
          timestamp: new Date().toISOString(),
        });
        await publishEvent(EXCHANGES.ENGAGEMENT, eventType, {
          recipeId,
          userId,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Новая реакция
        const reaction = this.reactionRepository.create({ userId, recipeId, type });
        await this.reactionRepository.save(reaction);

        await publishEvent(EXCHANGES.ENGAGEMENT, eventType, {
          recipeId,
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      // Подсчитываем статистику
      const likes = await this.reactionRepository.countBy({
        recipeId,
        type: ReactionType.LIKE,
      });
      const dislikes = await this.reactionRepository.countBy({
        recipeId,
        type: ReactionType.DISLIKE,
      });

      res.json({ likes, dislikes });
    } catch (error) {
      console.error('Reaction error:', error);
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  // Удалить реакцию
  removeReaction = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      const existingReaction = await this.reactionRepository.findOne({
        where: { userId, recipeId },
      });

      if (!existingReaction) {
        return res.status(404).json({ code: 404, message: 'Reaction not found' });
      }

      const eventType = existingReaction.type === ReactionType.LIKE
        ? EVENT_TYPES.RECIPE_UNLIKED
        : EVENT_TYPES.RECIPE_UNDISLIKED;

      await this.reactionRepository.delete({ userId, recipeId });

      await publishEvent(EXCHANGES.ENGAGEMENT, eventType, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      const likes = await this.reactionRepository.countBy({
        recipeId,
        type: ReactionType.LIKE,
      });
      const dislikes = await this.reactionRepository.countBy({
        recipeId,
        type: ReactionType.DISLIKE,
      });

      res.json({ likes, dislikes });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  // Получить лайкнутые рецепты пользователя
  getLikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const [reactions, total] = await this.reactionRepository.findAndCount({
        where: { userId, type: ReactionType.LIKE },
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
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  // Получить дизлайкнутые рецепты пользователя
  getDislikedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const [reactions, total] = await this.reactionRepository.findAndCount({
        where: { userId, type: ReactionType.DISLIKE },
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
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  // Получить статистику рецепта (для Internal API)
  getCounters = async (req: AuthRequest, res: Response) => {
    try {
      const serviceToken = req.headers['x-service-token'];
      if (serviceToken !== process.env.INTERNAL_TOKEN) {
        return res.status(401).json({ code: 401, message: 'Unauthorized' });
      }

      const recipeId = parseInt(req.params.id as string);
      const [likes, dislikes, comments, saves] = await Promise.all([
        this.reactionRepository.countBy({ recipeId, type: ReactionType.LIKE }),
        this.reactionRepository.countBy({ recipeId, type: ReactionType.DISLIKE }),
        this.commentRepository.countBy({ recipeId }),
        this.saveRepository.countBy({ recipeId }),
      ]);

      res.json({ likes, dislikes, comments, saves });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };
}