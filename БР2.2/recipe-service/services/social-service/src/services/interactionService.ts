import { AppDataSource } from '../config/data-source';
import { Like } from '../models/like.entity';
import { Favorite } from '../models/favorite.entity';
import { AppError } from '../utils/AppError';
import * as recipeClient from '../clients/recipeClient';

const likeRepo = () => AppDataSource.getRepository(Like);
const favoriteRepo = () => AppDataSource.getRepository(Favorite);

export async function likeRecipe(recipeId: number, userId: number): Promise<void> {
  const exists = await recipeClient.recipeExists(recipeId);
  if (!exists) throw new AppError('Рецепт не найден', 404);

  const existing = await likeRepo().findOne({ where: { recipeId, userId } });
  if (existing) throw new AppError('Рецепт уже лайкнут этим пользователем', 409);

  await likeRepo().save(likeRepo().create({ recipeId, userId }));
}

export async function unlikeRecipe(recipeId: number, userId: number): Promise<void> {
  const existing = await likeRepo().findOne({ where: { recipeId, userId } });
  if (!existing) throw new AppError('Лайк не найден', 404);
  await likeRepo().remove(existing);
}

export async function favoriteRecipe(recipeId: number, userId: number): Promise<void> {
  const exists = await recipeClient.recipeExists(recipeId);
  if (!exists) throw new AppError('Рецепт не найден', 404);

  const existing = await favoriteRepo().findOne({ where: { recipeId, userId } });
  if (existing) throw new AppError('Рецепт уже добавлен в избранное', 409);

  await favoriteRepo().save(favoriteRepo().create({ recipeId, userId }));
}

export async function unfavoriteRecipe(recipeId: number, userId: number): Promise<void> {
  const existing = await favoriteRepo().findOne({ where: { recipeId, userId } });
  if (!existing) throw new AppError('Рецепт не найден в избранном', 404);
  await favoriteRepo().remove(existing);
}

// GET /users/me/favorites — recipeId храним только мы, полные карточки запрашиваем у Recipe Service
export async function getMyFavorites(userId: number) {
  const favorites = await favoriteRepo().find({ where: { userId }, order: { createdAt: 'DESC' } });
  if (favorites.length === 0) return [];

  const recipes = await recipeClient.fetchRecipes(favorites.map((f) => f.recipeId));
  // Сохраняем порядок "недавно добавленное в избранное — первым"
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return favorites
    .map((f) => byId.get(f.recipeId))
    .filter((r): r is recipeClient.InternalRecipe => Boolean(r))
    .map((r) => ({ ...r, isFavorite: true }));
}
