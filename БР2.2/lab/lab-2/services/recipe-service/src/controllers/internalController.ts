import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as internalRecipeService from '../services/internalRecipeService';
import { AppError } from '../utils/AppError';

export const getRecipe = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await internalRecipeService.getInternalRecipeById(Number(req.params.id));
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  res.status(200).json(recipe);
});

export const getRecipes = asyncHandler(async (req: Request, res: Response) => {
  const idsParam = String(req.query.ids || '');
  const ids = idsParam.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
  const recipes = await internalRecipeService.getInternalRecipesByIds(ids);
  res.status(200).json(recipes);
});
