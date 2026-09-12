import { AppDataSource } from '../config/data-source';
import { Comment } from '../models/comment.entity';
import { Recipe } from '../models/recipe.entity';
import { AppError } from '../utils/AppError';
import { serializeComment } from '../utils/serializers';
import { validateCommentInput } from '../utils/validators';

const commentRepo = () => AppDataSource.getRepository(Comment);
const recipeRepo = () => AppDataSource.getRepository(Recipe);

interface CurrentUser {
  id: number;
  role: string;
}

export async function listComments(recipeId: number) {
  const recipe = await recipeRepo().findOne({ where: { id: recipeId } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

  const comments = await commentRepo().find({
    where: { recipeId },
    order: { createdAt: 'ASC' },
  });
  return comments.map(serializeComment);
}

export async function addComment(recipeId: number, userId: number, text: string) {
  validateCommentInput({ text });

  const recipe = await recipeRepo().findOne({ where: { id: recipeId } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

  const comment = commentRepo().create({ recipeId, userId, text });
  const saved = await commentRepo().save(comment);
  const full = await commentRepo().findOneOrFail({ where: { id: saved.id } });
  return serializeComment(full);
}

// Используется и для DELETE /comments/{id} (автор/админ), и для DELETE /admin/comments/{id} (админ)
export async function deleteComment(id: number, currentUser: CurrentUser): Promise<void> {
  const comment = await commentRepo().findOne({ where: { id } });
  if (!comment) throw new AppError('Комментарий не найден', 404);
  if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Недостаточно прав для удаления этого комментария', 403);
  }
  await commentRepo().remove(comment);
}
