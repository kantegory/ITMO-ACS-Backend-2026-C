import { config } from '../config/config';

export interface InternalRecipe {
  id: number;
  title: string;
  status: string;
  authorId: number;
  [key: string]: unknown;
}

// Используется перед лайком/избранным/комментарием — проверяем, что рецепт
// действительно существует, прежде чем создавать запись, ссылающуюся на его id
export async function recipeExists(recipeId: number): Promise<boolean> {
  try {
    const res = await fetch(`${config.recipeServiceUrl}/internal/recipes/${recipeId}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    return res.ok;
  } catch (err) {
    console.error('⚠️  Recipe Service недоступен (recipeExists):', (err as Error).message);
    // Отказываем безопасно: не даём поставить лайк на рецепт, если не можем проверить его существование
    return false;
  }
}

// Используется в GET /users/me/favorites — превращает список recipeId в список полных карточек
export async function fetchRecipes(ids: number[]): Promise<InternalRecipe[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  try {
    const res = await fetch(`${config.recipeServiceUrl}/internal/recipes?ids=${unique.join(',')}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    if (!res.ok) throw new Error(`Recipe Service ответил ${res.status}`);
    return (await res.json()) as InternalRecipe[];
  } catch (err) {
    console.error('⚠️  Recipe Service недоступен (fetchRecipes):', (err as Error).message);
    return [];
  }
}
