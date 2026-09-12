import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as commentService from '../services/commentService';

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(Number(req.params.id), req.user!);
  res.status(204).send();
});
