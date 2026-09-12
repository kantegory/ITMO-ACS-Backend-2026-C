import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as recipeService from '../services/recipeService';

export const approveRecipe = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.approveRecipe(Number(req.params.id));
  res.status(200).json(recipe);
});

export const rejectRecipe = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.rejectRecipe(Number(req.params.id));
  res.status(200).json(recipe);
});

export const deleteRecipe = asyncHandler(async (req: Request, res: Response) => {
  await recipeService.deleteRecipe(Number(req.params.id), req.user!);
  res.status(204).send();
});
