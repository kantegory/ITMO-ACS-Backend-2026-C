import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as internalUserService from '../services/internalUserService';
import { AppError } from '../utils/AppError';

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await internalUserService.getPublicUserById(Number(req.params.id));
  if (!user) throw new AppError('Пользователь не найден', 404);
  res.status(200).json(user);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const idsParam = String(req.query.ids || '');
  const ids = idsParam
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  const users = await internalUserService.getPublicUsersByIds(ids);
  res.status(200).json(users);
});
