"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const data_source_1 = require("../config/data-source");
const Comment_1 = require("../entities/Comment");
const connection_1 = require("../rabbitmq/connection");
class CommentController {
    constructor() {
        this.commentRepository = data_source_1.AppDataSource.getRepository(Comment_1.Comment);
        this.getComments = async (req, res) => {
            try {
                const recipeId = parseInt(req.params.id);
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
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.addComment = async (req, res) => {
            try {
                const userId = req.user.userId;
                const recipeId = parseInt(req.params.id);
                const { text } = req.body;
                const recipeResponse = await fetch(`${process.env.RECIPE_SERVICE_URL}/api/recipes/internal/recipes/${recipeId}`, {
                    headers: { 'X-Service-Token': process.env.INTERNAL_TOKEN },
                });
                if (recipeResponse.status === 404) {
                    return res.status(404).json({ code: 404, message: 'Recipe not found' });
                }
                const comment = this.commentRepository.create({
                    userId,
                    recipeId,
                    text,
                });
                await this.commentRepository.save(comment);
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.EVENT_TYPES.RECIPE_COMMENTED, {
                    recipeId,
                    userId,
                    commentId: comment.id,
                    timestamp: new Date().toISOString(),
                });
                res.status(201).json(comment);
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.deleteComment = async (req, res) => {
            try {
                const userId = req.user.userId;
                const commentId = parseInt(req.params.id);
                const comment = await this.commentRepository.findOneBy({ id: commentId });
                if (!comment) {
                    return res.status(404).json({ code: 404, message: 'Comment not found' });
                }
                if (comment.userId !== userId && req.user.role !== 'ADMIN') {
                    return res.status(403).json({ code: 403, message: 'Forbidden' });
                }
                await this.commentRepository.delete(commentId);
                await (0, connection_1.publishEvent)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.EVENT_TYPES.RECIPE_COMMENT_DELETED, {
                    recipeId: comment.recipeId,
                    commentId,
                    timestamp: new Date().toISOString(),
                });
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.CommentController = CommentController;
