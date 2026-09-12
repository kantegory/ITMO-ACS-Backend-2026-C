import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as unitService from '../services/unitService';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const units = await unitService.listUnits();
  res.status(200).json(units);
});
