import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { Comment } from '../entities/Comment';
import { Recipe } from '../entities/Recipe';

export class CommentController {
  private commentRepository = AppDataSource.getRepository(Comment);
  private recipeRepository = AppDataSource.getRepository(Recipe);

  getComments = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const [comments, total] = await this.commentRepository.findAndCount({
        where: { recipeId: Number(recipeId) },
        relations: ['user'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' }
      });

      res.json({
        items: comments,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  addComment = async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId } = req.params;
      const { text } = req.body;

      const recipe = await this.recipeRepository.findOneBy({ id: Number(recipeId) });
      if (!recipe) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      const comment = this.commentRepository.create({
        recipeId: Number(recipeId),
        userId: req.user!.id,
        text
      });

      await this.commentRepository.save(comment);

      const savedComment = await this.commentRepository.findOne({
        where: { id: comment.id },
        relations: ['user']
      });

      res.status(201).json(savedComment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };

  deleteComment = async (req: AuthRequest, res: Response) => {
    try {
      const { commentId } = req.params;

      const comment = await this.commentRepository.findOne({
        where: { id: Number(commentId) },
        relations: ['recipe']
      });

      if (!comment) {
        return res.status(404).json({
          code: 404,
          message: "Not Found: Resource doesn't exist"
        });
      }

      if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden: You do not have permission'
        });
      }

      await this.commentRepository.delete(comment.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error occurred'
      });
    }
  };
}