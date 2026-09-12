import { AppDataSource } from '../config/data-source';
import { Like } from '../models/like.entity';
import { Favorite } from '../models/favorite.entity';
import { Comment } from '../models/comment.entity';

const likeRepo = () => AppDataSource.getRepository(Like);
const favoriteRepo = () => AppDataSource.getRepository(Favorite);
const commentRepo = () => AppDataSource.getRepository(Comment);

// GET /internal/likes/count/{recipeId} — используется Recipe Service в GET /recipes/{id}
export async function getLikesCount(recipeId: number): Promise<number> {
  return likeRepo().count({ where: { recipeId } });
}

// GET /internal/likes/counts?recipeIds=1,2,3 — батч-версия для GET /recipes (список)
export async function getLikesCounts(recipeIds: number[]): Promise<{ recipeId: number; count: number }[]> {
  if (recipeIds.length === 0) return [];
  const rows = await likeRepo()
    .createQueryBuilder('like')
    .select('like.recipeId', 'recipeId')
    .addSelect('COUNT(*)', 'cnt')
    .where('like.recipeId IN (:...ids)', { ids: recipeIds })
    .groupBy('like.recipeId')
    .getRawMany<{ recipeId: number; cnt: string }>();
  return rows.map((r) => ({ recipeId: r.recipeId, count: Number(r.cnt) }));
}

// GET /internal/interactions?recipeId=&userId= — используется в GET /recipes/{id} (isLiked/isFavorite)
export async function getInteractions(recipeId: number, userId: number) {
  const [like, favorite] = await Promise.all([
    likeRepo().findOne({ where: { recipeId, userId } }),
    favoriteRepo().findOne({ where: { recipeId, userId } }),
  ]);
  return { isLiked: Boolean(like), isFavorite: Boolean(favorite) };
}

// DELETE /internal/recipes/{recipeId}/interactions — вызывается Recipe Service при удалении рецепта.
// Идемпотентна: если данных не было, ничего страшного не происходит.
export async function deleteInteractionsForRecipe(recipeId: number): Promise<void> {
  await commentRepo().delete({ recipeId });
  await likeRepo().delete({ recipeId });
  await favoriteRepo().delete({ recipeId });
}
