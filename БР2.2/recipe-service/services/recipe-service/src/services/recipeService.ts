import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Recipe, Difficulty, RecipeStatus } from '../models/recipe.entity';
import { Category } from '../models/category.entity';
import { Tag } from '../models/tag.entity';
import { Ingredient } from '../models/ingredient.entity';
import { Step } from '../models/step.entity';
import { AppError } from '../utils/AppError';
import { serializeRecipe } from '../utils/serializers';
import { validateRecipeInput } from '../utils/validators';
import * as authClient from '../clients/authClient';
import * as socialClient from '../clients/socialClient';
import { publishRecipeDeleted } from '../queue/rabbitmq';

const recipeRepo = () => AppDataSource.getRepository(Recipe);
const categoryRepo = () => AppDataSource.getRepository(Category);
const tagRepo = () => AppDataSource.getRepository(Tag);
const ingredientRepo = () => AppDataSource.getRepository(Ingredient);
const stepRepo = () => AppDataSource.getRepository(Step);

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

  const qb = recipeRepo()
    .createQueryBuilder('recipe')
    .select('recipe.id', 'id')
    .addSelect('recipe.difficulty', 'difficulty')
    .addSelect('recipe.createdAt', 'createdAt')
    .where('recipe.status = :status', { status: 'published' as RecipeStatus });

  if (params.search) qb.andWhere('recipe.title LIKE :search', { search: `%${params.search}%` });
  if (params.categoryId) qb.andWhere('recipe.categoryId = :categoryId', { categoryId: params.categoryId });
  if (params.difficulty) qb.andWhere('recipe.difficulty = :difficulty', { difficulty: params.difficulty });
  if (params.cookingTime) qb.andWhere('recipe.cookingTime <= :cookingTime', { cookingTime: params.cookingTime });
  if (params.tagId) qb.innerJoin('recipe.tags', 'tag', 'tag.id = :tagId', { tagId: params.tagId });

  const rows = await qb.getRawMany<{ id: number; difficulty: Difficulty; createdAt: string }>();
  const total = rows.length;

  // Для сортировки по популярности нужны реальные счётчики лайков — идём в Social Service
  let likesMap = new Map<number, number>();
  if (params.sortBy === 'popularity' && rows.length > 0) {
    likesMap = await socialClient.fetchLikesCounts(rows.map((r) => r.id));
  }

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

  const start = (page - 1) * limit;
  const pageIds = rows.slice(start, start + limit).map((r) => r.id);

  let items: ReturnType<typeof serializeRecipe>[] = [];
  if (pageIds.length > 0) {
    const recipes = await recipeRepo().find({ where: { id: In(pageIds) } });
    const byId = new Map(recipes.map((r) => [r.id, r]));
    const ordered = pageIds.map((id) => byId.get(id)).filter((r): r is Recipe => Boolean(r));

    // Один батч-запрос на авторов и один на счётчики лайков для всей страницы —
    // а не по отдельному сетевому запросу на каждый рецепт (важно для производительности)
    const [authors, counts] = await Promise.all([
      authClient.fetchUsers(ordered.map((r) => r.authorId)),
      socialClient.fetchLikesCounts(ordered.map((r) => r.id)),
    ]);

    items = ordered.map((r) =>
      serializeRecipe(r, {
        author: authors.get(r.authorId) || { id: r.authorId, username: 'неизвестный пользователь', role: 'user' },
        likesCount: counts.get(r.id) || 0,
      })
    );
  }

  return { items, total, page, limit };
}

export async function getRecipeById(id: number, currentUser?: CurrentUser) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);

  const isOwner = currentUser?.id === recipe.authorId;
  const isAdmin = currentUser?.role === 'admin';
  if (recipe.status !== 'published' && !isOwner && !isAdmin) {
    throw new AppError('Рецепт не найден', 404);
  }

  const [author, likesCount, interactions] = await Promise.all([
    authClient.fetchUser(recipe.authorId),
    socialClient.fetchLikesCount(id),
    currentUser ? socialClient.fetchInteractions(id, currentUser.id) : Promise.resolve(undefined),
  ]);

  return serializeRecipe(recipe, {
    author,
    likesCount,
    isLiked: interactions?.isLiked,
    isFavorite: interactions?.isFavorite,
  });
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
  const author = await authClient.fetchUser(authorId);
  return serializeRecipe(full, { author, likesCount: 0 });
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
  recipe.ingredients = data.ingredients as Ingredient[];
  recipe.steps = data.steps as Step[];

  const saved = await recipeRepo().save(recipe);
  const [author, likesCount] = await Promise.all([
    authClient.fetchUser(saved.authorId),
    socialClient.fetchLikesCount(id),
  ]);
  return serializeRecipe(saved, { author, likesCount });
}

export async function deleteRecipe(id: number, currentUser: CurrentUser) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.authorId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Недостаточно прав для удаления этого рецепта', 403);
  }

  await ingredientRepo().delete({ recipeId: id });
  await stepRepo().delete({ recipeId: id });
  await recipeRepo().delete({ id });

  // ДЗ5: раньше здесь был синхронный HTTP-вызов Social Service, который мог
  // отменить всё удаление, если Social Service был недоступен. Теперь мы просто
  // публикуем событие в RabbitMQ и не ждём ответа — Social Service обработает
  // его сам, когда сможет (даже если в этот момент был выключен, сообщение
  // будет ждать его в очереди).
  publishRecipeDeleted(id);
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
  const [author, likesCount] = await Promise.all([
    authClient.fetchUser(saved.authorId),
    socialClient.fetchLikesCount(id),
  ]);
  return serializeRecipe(saved, { author, likesCount });
}

export async function approveRecipe(id: number) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.status !== 'pending') {
    throw new AppError(`Рецепт со статусом "${recipe.status}" нельзя одобрить`, 409);
  }
  recipe.status = 'published';
  const saved = await recipeRepo().save(recipe);
  const [author, likesCount] = await Promise.all([
    authClient.fetchUser(saved.authorId),
    socialClient.fetchLikesCount(id),
  ]);
  return serializeRecipe(saved, { author, likesCount });
}

export async function rejectRecipe(id: number) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) throw new AppError('Рецепт не найден', 404);
  if (recipe.status !== 'pending') {
    throw new AppError(`Рецепт со статусом "${recipe.status}" нельзя отклонить`, 409);
  }
  recipe.status = 'rejected';
  const saved = await recipeRepo().save(recipe);
  const [author, likesCount] = await Promise.all([
    authClient.fetchUser(saved.authorId),
    socialClient.fetchLikesCount(id),
  ]);
  return serializeRecipe(saved, { author, likesCount });
}

// GET /users/me/recipes — раньше жил в userService монолита, переехал сюда,
// потому что данные принадлежат Recipe Service
export async function getMyRecipes(userId: number) {
  const recipes = await recipeRepo().find({ where: { authorId: userId }, order: { createdAt: 'DESC' } });
  if (recipes.length === 0) return [];

  const [author, counts] = await Promise.all([
    authClient.fetchUser(userId),
    socialClient.fetchLikesCounts(recipes.map((r) => r.id)),
  ]);

  return recipes.map((r) => serializeRecipe(r, { author, likesCount: counts.get(r.id) || 0 }));
}
