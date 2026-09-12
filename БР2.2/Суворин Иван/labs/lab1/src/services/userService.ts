import { AppDataSource } from '../config/data-source';
import { User } from '../models/user.entity';
import { Recipe } from '../models/recipe.entity';
import { Favorite } from '../models/favorite.entity';
import { Like } from '../models/like.entity';
import { AppError } from '../utils/AppError';
import { serializeUser, serializeRecipe } from '../utils/serializers';

const userRepo = () => AppDataSource.getRepository(User);
const recipeRepo = () => AppDataSource.getRepository(Recipe);
const favoriteRepo = () => AppDataSource.getRepository(Favorite);
const likeRepo = () => AppDataSource.getRepository(Like);

// Подгружает количество лайков для набора рецептов одним запросом
// и записывает его прямо в recipe.likesCount (используется в нескольких местах ниже)
async function attachLikesCounts(recipes: Recipe[]): Promise<void> {
  if (recipes.length === 0) return;
  const ids = recipes.map((r) => r.id);
  const rows = await likeRepo()
    .createQueryBuilder('like')
    .select('like.recipeId', 'recipeId')
    .addSelect('COUNT(*)', 'cnt')
    .where('like.recipeId IN (:...ids)', { ids })
    .groupBy('like.recipeId')
    .getRawMany<{ recipeId: number; cnt: string }>();
  const counts = new Map<number, number>(rows.map((r) => [r.recipeId, Number(r.cnt)]));
  recipes.forEach((r) => {
    r.likesCount = counts.get(r.id) || 0;
  });
}

export async function getMe(userId: number) {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) throw new AppError('Пользователь не найден', 404);
  return serializeUser(user);
}

interface UpdateMeDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export async function updateMe(userId: number, data: UpdateMeDto) {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) throw new AppError('Пользователь не найден', 404);

  if (data.username && data.username !== user.username) {
    const exists = await userRepo().findOne({ where: { username: data.username } });
    if (exists) throw new AppError('Такой никнейм уже занят', 409);
    user.username = data.username;
  }
  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  const saved = await userRepo().save(user);
  return serializeUser(saved);
}

export async function getMyRecipes(userId: number) {
  const recipes = await recipeRepo().find({
    where: { authorId: userId },
    order: { createdAt: 'DESC' },
  });
  await attachLikesCounts(recipes);
  return recipes.map((r) => serializeRecipe(r));
}

export async function getMyFavorites(userId: number) {
  const favorites = await favoriteRepo().find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
  const recipes = favorites.map((f) => f.recipe);
  await attachLikesCounts(recipes);
  return recipes.map((r) => serializeRecipe(r, { isFavorite: true }));
}
