import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Comment } from '../entities/Comment';

export class CommentController {
  private commentRepository = AppDataSource.getRepository(Comment);

  getComments = async (req: AuthRequest, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id as string);
      const { page = 1, limit = 20 } = req.query;

      const [comments, total] = await this.commentRepository.findAndCount({
        where: { recipeId },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' },
      });

      res.json({
        items: comments,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  addComment = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const recipeId = parseInt(req.params.id as string);
      const { text } = req.body;

      const recipeResponse = await fetch(
        `${process.env.RECIPE_SERVICE_URL}/internal/recipes/${recipeId}`,
        {
          headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN! },
        }
      );

      if (recipeResponse.status === 404) {
        return res.status(404).json({ code: 404, message: 'Recipe not found' });
      }

      const comment = this.commentRepository.create({
        userId,
        recipeId,
        text,
      });

      await this.commentRepository.save(comment);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };

  deleteComment = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const commentId = parseInt(req.params.id as string);

      const comment = await this.commentRepository.findOneBy({ id: commentId });

      if (!comment) {
        return res.status(404).json({ code: 404, message: 'Comment not found' });
      }

      if (comment.userId !== userId && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ code: 403, message: 'Forbidden' });
      }

      await this.commentRepository.delete(commentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  };
}