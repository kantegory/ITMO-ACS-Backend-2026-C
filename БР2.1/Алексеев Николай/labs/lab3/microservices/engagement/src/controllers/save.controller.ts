import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { SavedRecipe } from '../entities/SavedRecipe';
import { publishEvent, EXCHANGES, EVENT_TYPES } from '../rabbitmq/connection';

export class SaveController {
  private saveRepository = AppDataSource.getRepository(SavedRecipe);

  save = async (req: AuthRequest, res: Response) => {
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

      const existing = await this.saveRepository.findOne({
        where: { userId, recipeId },
      });

      if (existing) {
        return res.status(409).json({ code: 409, message: 'Already saved' });
      }

      const saved = this.saveRepository.create({ userId, recipeId });
      await this.saveRepository.save(saved);

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_SAVED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  unsave = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);

      await this.saveRepository.delete({ userId, recipeId });

      await publishEvent(EXCHANGES.ENGAGEMENT, EVENT_TYPES.RECIPE_UNSAVED, {
        recipeId,
        userId,
        timestamp: new Date().toISOString(),
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  getSavedRecipes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
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
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };
}