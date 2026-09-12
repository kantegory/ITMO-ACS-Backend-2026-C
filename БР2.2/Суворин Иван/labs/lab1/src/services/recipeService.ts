import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Recipe, Difficulty, RecipeStatus } from '../models/recipe.entity';
import { Category } from '../models/category.entity';
import { Tag } from '../models/tag.entity';
import { Like } from '../models/like.entity';
import { Favorite } from '../models/favorite.entity';
import { Ingredient } from '../models/ingredient.entity';
import { Step } from '../models/step.entity';
import { Comment } from '../models/comment.entity';
import { AppError } from '../utils/AppError';
import { serializeRecipe } from '../utils/serializers';
import { validateRecipeInput } from '../utils/validators';

const recipeRepo = () => AppDataSource.getRepository(Recipe);
const categoryRepo = () => AppDataSource.getRepository(Category);
const tagRepo = () => AppDataSource.getRepository(Tag);
const likeRepo = () => AppDataSource.getRepository(Like);
const favoriteRepo = () => AppDataSource.getRepository(Favorite);
const ingredientRepo = () => AppDataSource.getRepository(Ingredient);
const stepRepo = () => AppDataSource.getRepository(Step);
const commentRepo = () => AppDataSource.getRepository(Comment);

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

interface CurrentUser {
  id: number;
  role: string;
}

interface RecipeInputDto {
  title: string;
  shortDescription: string;
  fullDescription: string;
  difficulty: Difficulty;
  cookingTime: number;
  categoryId: number;
  tagIds: number[];
  ingredients: { name: string; quantity: string; unit?: string }[];
  steps: { order: number; description: string }[];
  image?: string;
}

// Проверяет, что категория и все теги существуют, и возвращает загруженные сущности
async function resolveCategoryAndTags(categoryId: number, tagIds: number[]) {
  const category = await categoryRepo().findOne({ where: { id: categoryId } });
  if (!category) throw new AppError('Указанная категория не найдена', 400);

  let tags: Tag[] = [];
  if (tagIds.length > 0) {
    tags = await tagRepo().findBy({ id: In(tagIds) });
    if (tags.length !== tagIds.length) {
      throw new AppError('Один или несколько указанных тегов не найдены', 400);
    }
  }
  return { category, tags };
}

async function attachLikesCount(recipe: Recipe): Promise<Recipe> {
  recipe.likesCount = await likeRepo().count({ where: { recipeId: recipe.id } });
  return recipe;
}

async function attachLikesCounts(recipes: Recipe[]): Promise<Recipe[]> {
  if (recipes.length === 0) return recipes;
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
  return recipes;
}

interface ListParams {
  search?: string;
  categoryId?: number;
  difficulty?: string;
  cookingTime?: number;
  tagId?: number;
  sortBy?: 'difficulty' | 'popularity';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function listRecipes(params: ListParams) {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(Math.floor(params.limit), 50) : 10;

  // Шаг 1: находим ID всех подходящих под фильтры рецептов (только опубликованные).
  // Джойн по тегам подключаем, только если реально фильтруем по tagId —
  // так не размножаются строки при выборке (не нужен DISTINCT/группировка).
  const qb = recipeRepo()
    .createQueryBuilder('recipe')
    .select('recipe.id', 'id')
    .addSelect('recipe.difficulty', 'difficulty')
    .addSelect('recipe.createdAt', 'createdAt')
    .where('recipe.status = :status', { status: 'published' as RecipeStatus });

  if (params.search) {
    qb.andWhere('recipe.title LIKE :search', { search: `%${params.search}%` });
  }
  if (params.categoryId) {
    qb.andWhere('recipe.categoryId = :categoryId', { categoryId: params.categoryId });
  }
  if (params.difficulty) {
    qb.andWhere('recipe.difficulty = :difficulty', { difficulty: params.difficulty });
  }
  if (params.cookingTime) {
    qb.andWhere('recipe.cookingTime <= :cookingTime', { cookingTime: params.cookingTime });
  }
  if (params.tagId) {
    qb.innerJoin('recipe.tags', 'tag', 'tag.id = :tagId', { tagId: params.tagId });
  }

  const rows = await qb.getRawMany<{ id: number; difficulty: Difficulty; createdAt: string }>();
  const total = rows.length;

  // Шаг 2: если сортируем по популярности — отдельно считаем лайки для найденных рецептов
  let likesMap = new Map<number, number>();
  if (params.sortBy === 'popularity' && rows.length > 0) {
    const counts = await likeRepo()
      .createQueryBuilder('like')
      .select('like.recipeId', 'recipeId')
      .addSelect('COUNT(*)', 'cnt')
      .where('like.recipeId IN (:...ids)', { ids: rows.map((r) => r.id) })
      .groupBy('like.recipeId')
      .getRawMany<{ recipeId: number; cnt: string }>();
    likesMap = new Map<number, number>(counts.map((c) => [c.recipeId, Number(c.cnt)]));
  }

  // Шаг 3: сортировка в памяти (данных в учебном проекте немного, это не проблема)
  const orderMultiplier = params.order === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    let diff = 0;
    if (params.sortBy === 'difficulty') {
      diff = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
    } else if (params.sortBy === 'popularity') {
      diff = (likesMap.get(a.id) || 0) - (likesMap.get(b.id) || 0);
    } else {
      diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return diff * orderMultiplier;
  });

  // Шаг 4: пагинация по уже отсортированному списку ID
  const start = (page - 1) * limit;
  const pageIds = rows.slice(start, start + limit).map((r) => r.id);

  let items: ReturnType<typeof serializeRecipe>[] = [];
  if (pageIds.length > 0) {
    const recipes = await recipeRepo().find({ where: { id: In(pageIds) } });
    await attachLikesCounts(recipes);
    const byId = new Map<number, Recipe>(recipes.map((r) => [r.id, r]));
    items = pageIds
      .map((id) => byId.get(id))
      .filter((r): r is Recipe => Boolean(r))
      .map((r) => serializeRecipe(r));
  }

  return { items, total, page, limit };
}

export async function getRecipeById(id: number, currentUser?: CurrentUser) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

  const isOwner = currentUser?.id === recipe.authorId;
  const isAdmin = currentUser?.role === 'admin';
  if (recipe.status !== 'published' && !isOwner && !isAdmin) {
    // Не раскрываем существование чужого неопубликованного рецепта
    throw new AppError('Рецепт не найден', 404);
  }

  await attachLikesCount(recipe);

  let isLiked: boolean | undefined;
  let isFavorite: boolean | undefined;
  if (currentUser) {
    isLiked = Boolean(
      await likeRepo().findOne({ where: { userId: currentUser.id, recipeId: id } })
    );
    isFavorite = Boolean(
      await favoriteRepo().findOne({ where: { userId: currentUser.id, recipeId: id } })
    );
  }

  return serializeRecipe(recipe, { isLiked, isFavorite });
}

export async function createRecipe(data: RecipeInputDto, authorId: number) {
  validateRecipeInput(data);
  const { category, tags } = await resolveCategoryAndTags(data.categoryId, data.tagIds);

  const recipe = recipeRepo().create({
    title: data.title,
    shortDescription: data.shortDescription,
    fullDescription: data.fullDescription,
    difficulty: data.difficulty,
    cookingTime: data.cookingTime,
    image: data.image,
    status: 'draft',
    authorId,
    categoryId: category.id,
    category,
    tags,
    ingredients: data.ingredients,
    steps: data.steps,
  });

  const saved = await recipeRepo().save(recipe);
  const full = await recipeRepo().findOneOrFail({ where: { id: saved.id } });
  full.likesCount = 0;
  return serializeRecipe(full);
}

export async function updateRecipe(id: number, data: RecipeInputDto, currentUser: CurrentUser) {
  validateRecipeInput(data);

  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.authorId !== currentUser.id) {
    throw new AppError('Редактировать рецепт может только его автор', 403);
  }

  const { category, tags } = await resolveCategoryAndTags(data.categoryId, data.tagIds);

  recipe.title = data.title;
  recipe.shortDescription = data.shortDescription;
  recipe.fullDescription = data.fullDescription;
  recipe.difficulty = data.difficulty;
  recipe.cookingTime = data.cookingTime;
  recipe.image = data.image;
  recipe.categoryId = category.id;
  recipe.category = category;
  recipe.tags = tags;
  // orphanedRowAction: 'delete' на сущности Recipe сам удалит старые ingredients/steps,
  // которых больше нет в новом списке
  recipe.ingredients = data.ingredients as Ingredient[];
  recipe.steps = data.steps as Step[];

  const saved = await recipeRepo().save(recipe);
  await attachLikesCount(saved);
  return serializeRecipe(saved);
}

// Используется и для DELETE /recipes/{id} (автор/админ), и для DELETE /admin/recipes/{id} (админ)
export async function deleteRecipe(id: number, currentUser: CurrentUser) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.authorId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Недостаточно прав для удаления этого рецепта', 403);
  }

  // Удаляем зависимые записи явно, не полагаясь на настройки каскада в конкретной БД —
  // так поведение предсказуемо в любой конфигурации
  await ingredientRepo().delete({ recipeId: id });
  await stepRepo().delete({ recipeId: id });
  await commentRepo().delete({ recipeId: id });
  await likeRepo().delete({ recipeId: id });
  await favoriteRepo().delete({ recipeId: id });
  await recipeRepo().delete({ id });
}

export async function submitRecipe(id: number, currentUser: CurrentUser) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.authorId !== currentUser.id) {
    throw new AppError('Отправить рецепт на модерацию может только его автор', 403);
  }
  if (recipe.status !== 'draft' && recipe.status !== 'rejected') {
    throw new AppError(`Рецепт со статусом "${recipe.status}" нельзя отправить на модерацию`, 409);
  }

  recipe.status = 'pending';
  const saved = await recipeRepo().save(recipe);
  await attachLikesCount(saved);
  return serializeRecipe(saved);
}

export async function approveRecipe(id: number) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.status !== 'pending') {
    throw new AppError(`Рецепт со статусом "${recipe.status}" нельзя одобрить`, 409);
  }
  recipe.status = 'published';
  const saved = await recipeRepo().save(recipe);
  await attachLikesCount(saved);
  return serializeRecipe(saved);
}

export async function rejectRecipe(id: number) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.status !== 'pending') {
    throw new AppError(`Рецепт со статусом "${recipe.status}" нельзя отклонить`, 409);
  }
  recipe.status = 'rejected';
  const saved = await recipeRepo().save(recipe);
  await attachLikesCount(saved);
  return serializeRecipe(saved);
}

export async function likeRecipe(recipeId: number, userId: number): Promise<void> {
  const recipe = await recipeRepo().findOne({ where: { id: recipeId } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

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
  const recipe = await recipeRepo().findOne({ where: { id: recipeId } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

  const existing = await favoriteRepo().findOne({ where: { recipeId, userId } });
  if (existing) throw new AppError('Рецепт уже добавлен в избранное', 409);

  await favoriteRepo().save(favoriteRepo().create({ recipeId, userId }));
}

export async function unfavoriteRecipe(recipeId: number, userId: number): Promise<void> {
  const existing = await favoriteRepo().findOne({ where: { recipeId, userId } });
  if (!existing) throw new AppError('Рецепт не найден в избранном', 404);
  await favoriteRepo().remove(existing);
}
