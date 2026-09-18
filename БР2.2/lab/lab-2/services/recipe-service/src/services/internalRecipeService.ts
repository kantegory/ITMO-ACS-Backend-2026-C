import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Recipe } from '../models/recipe.entity';
import { serializeInternalRecipe } from '../utils/serializers';
import * as authClient from '../clients/authClient';
import * as socialClient from '../clients/socialClient';

const recipeRepo = () => AppDataSource.getRepository(Recipe);

// GET /internal/recipes/{id} — используется Social Service, чтобы (а) проверить,
// что рецепт существует, прежде чем разрешить лайк/комментарий/избранное,
// и (б) получить карточку рецепта целиком
export async function getInternalRecipeById(id: number) {
  const recipe = await recipeRepo().findOne({ where: { id } });
  if (!recipe) return null;
  const [author, likesCount] = await Promise.all([
    authClient.fetchUser(recipe.authorId),
    socialClient.fetchLikesCount(id),
  ]);
  return serializeInternalRecipe(recipe, author, likesCount);
}

// GET /internal/recipes?ids=1,2,3 — используется Social Service в GET /users/me/favorites,
// чтобы превратить список recipeId в список полных карточек
export async function getInternalRecipesByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const recipes = await recipeRepo().find({ where: { id: In(ids) } });
  if (recipes.length === 0) return [];

  const [authors, counts] = await Promise.all([
    authClient.fetchUsers(recipes.map((r) => r.authorId)),
    socialClient.fetchLikesCounts(recipes.map((r) => r.id)),
  ]);

  return recipes.map((r) =>
    serializeInternalRecipe(
      r,
      authors.get(r.authorId) || { id: r.authorId, username: 'неизвестный пользователь', role: 'user' },
      counts.get(r.id) || 0
    )
  );
}
