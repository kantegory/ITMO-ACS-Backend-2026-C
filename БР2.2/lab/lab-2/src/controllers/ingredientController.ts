import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as ingredientService from '../services/ingredientService';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;
  const result = await ingredientService.searchIngredients(
    typeof search === 'string' ? search : undefined
  );
  res.status(200).json(result);
});
