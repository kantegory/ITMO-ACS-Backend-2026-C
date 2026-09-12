import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as interactionService from '../services/interactionService';

export const like = asyncHandler(async (req: Request, res: Response) => {
  await interactionService.likeRecipe(Number(req.params.id), req.user!.id);
  res.status(204).send();
});

export const unlike = asyncHandler(async (req: Request, res: Response) => {
  await interactionService.unlikeRecipe(Number(req.params.id), req.user!.id);
  res.status(204).send();
});

export const favorite = asyncHandler(async (req: Request, res: Response) => {
  await interactionService.favoriteRecipe(Number(req.params.id), req.user!.id);
  res.status(204).send();
});

export const unfavorite = asyncHandler(async (req: Request, res: Response) => {
  await interactionService.unfavoriteRecipe(Number(req.params.id), req.user!.id);
  res.status(204).send();
});

export const myFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await interactionService.getMyFavorites(req.user!.id);
  res.status(200).json(favorites);
});
