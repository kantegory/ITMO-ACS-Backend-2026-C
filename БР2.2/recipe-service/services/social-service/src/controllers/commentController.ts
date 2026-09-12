import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as commentService from '../services/commentService';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const comments = await commentService.listComments(Number(req.params.recipeId));
  res.status(200).json(comments);
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.addComment(Number(req.params.recipeId), req.user!.id, req.body?.text);
  res.status(200).json(comment);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(Number(req.params.id), req.user!);
  res.status(204).send();
});
