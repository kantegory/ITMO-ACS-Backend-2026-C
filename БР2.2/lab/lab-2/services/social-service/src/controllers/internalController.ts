import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as internalSocialService from '../services/internalSocialService';

export const getLikesCount = asyncHandler(async (req: Request, res: Response) => {
  const recipeId = Number(req.params.recipeId);
  const count = await internalSocialService.getLikesCount(recipeId);
  res.status(200).json({ recipeId, count });
});

export const getLikesCounts = asyncHandler(async (req: Request, res: Response) => {
  const idsParam = String(req.query.recipeIds || '');
  const ids = idsParam.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
  const counts = await internalSocialService.getLikesCounts(ids);
  res.status(200).json(counts);
});

export const getInteractions = asyncHandler(async (req: Request, res: Response) => {
  const recipeId = Number(req.query.recipeId);
  const userId = Number(req.query.userId);
  const result = await internalSocialService.getInteractions(recipeId, userId);
  res.status(200).json(result);
});

export const deleteInteractions = asyncHandler(async (req: Request, res: Response) => {
  await internalSocialService.deleteInteractionsForRecipe(Number(req.params.recipeId));
  res.status(204).send();
});
