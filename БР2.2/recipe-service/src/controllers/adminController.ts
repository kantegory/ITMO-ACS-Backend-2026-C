import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as recipeService from '../services/recipeService';
import * as commentService from '../services/commentService';

export const approveRecipe = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.approveRecipe(Number(req.params.id));
  res.status(200).json(recipe);
});

export const rejectRecipe = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.rejectRecipe(Number(req.params.id));
  res.status(200).json(recipe);
});

export const deleteRecipe = asyncHandler(async (req: Request, res: Response) => {
  // req.user точно admin — так как маршрут защищён requireAdmin
  await recipeService.deleteRecipe(Number(req.params.id), req.user!);
  res.status(204).send();
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(Number(req.params.id), req.user!);
  res.status(204).send();
});
