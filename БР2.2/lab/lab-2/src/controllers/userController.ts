import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as userService from '../services/userService';

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.id);
  res.status(200).json(user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.id, req.body);
  res.status(200).json(user);
});

export const myRecipes = asyncHandler(async (req: Request, res: Response) => {
  const recipes = await userService.getMyRecipes(req.user!.id);
  res.status(200).json(recipes);
});

export const myFavorites = asyncHandler(async (req: Request, res: Response) => {
  const recipes = await userService.getMyFavorites(req.user!.id);
  res.status(200).json(recipes);
});
