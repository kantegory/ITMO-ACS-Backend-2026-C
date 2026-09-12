import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as recipeService from '../services/recipeService';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, categoryId, difficulty, cookingTime, tagId, sortBy, order, page, limit } = req.query;
  const result = await recipeService.listRecipes({
    search: typeof search === 'string' ? search : undefined,
    categoryId: toNumber(categoryId),
    difficulty: typeof difficulty === 'string' ? difficulty : undefined,
    cookingTime: toNumber(cookingTime),
    tagId: toNumber(tagId),
    sortBy: sortBy === 'difficulty' || sortBy === 'popularity' ? sortBy : undefined,
    order: order === 'asc' || order === 'desc' ? order : undefined,
    page: toNumber(page),
    limit: toNumber(limit),
  });
  res.status(200).json(result);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.getRecipeById(Number(req.params.id), req.user);
  res.status(200).json(recipe);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.createRecipe(req.body, req.user!.id);
  res.status(200).json(recipe);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.updateRecipe(Number(req.params.id), req.body, req.user!);
  res.status(200).json(recipe);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await recipeService.deleteRecipe(Number(req.params.id), req.user!);
  res.status(204).send();
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const recipe = await recipeService.submitRecipe(Number(req.params.id), req.user!);
  res.status(200).json(recipe);
});

export const myRecipes = asyncHandler(async (req: Request, res: Response) => {
  const recipes = await recipeService.getMyRecipes(req.user!.id);
  res.status(200).json(recipes);
});
