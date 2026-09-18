import { AppDataSource } from '../config/data-source';
import { Comment } from '../models/comment.entity';
import { AppError } from '../utils/AppError';
import * as authClient from '../clients/authClient';
import * as recipeClient from '../clients/recipeClient';

const commentRepo = () => AppDataSource.getRepository(Comment);

interface CurrentUser {
  id: number;
  role: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function listComments(recipeId: number) {
  const exists = await recipeClient.recipeExists(recipeId);
  if (!exists) throw new AppError('Рецепт не найден', 404);

  const comments = await commentRepo().find({ where: { recipeId }, order: { createdAt: 'ASC' } });
  if (comments.length === 0) return [];

  const authors = await authClient.fetchUsers(comments.map((c) => c.userId));
  return comments.map((c) => ({
    id: c.id,
    text: c.text,
    user: authors.get(c.userId) || { id: c.userId, username: 'неизвестный пользователь', role: 'user' },
  }));
}

export async function addComment(recipeId: number, userId: number, text: string) {
  if (!isNonEmptyString(text)) throw new AppError('Текст комментария обязателен', 400);

  const exists = await recipeClient.recipeExists(recipeId);
  if (!exists) throw new AppError('Рецепт не найден', 404);

  const comment = commentRepo().create({ recipeId, userId, text });
  const saved = await commentRepo().save(comment);
  const author = await authClient.fetchUser(userId);

  return { id: saved.id, text: saved.text, user: author };
}

export async function deleteComment(id: number, currentUser: CurrentUser): Promise<void> {
  const comment = await commentRepo().findOne({ where: { id } });
  if (!comment) throw new AppError('Комментарий не найден', 404);
  if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Недостаточно прав для удаления этого комментария', 403);
  }
  await commentRepo().remove(comment);
}
