import { config } from '../config/config';

// Если Social Service недоступен — рецепт всё равно должен показаться,
// просто без точных лайков/отметок (это решение зафиксировано в ДЗ4)
export async function fetchLikesCount(recipeId: number): Promise<number> {
  try {
    const res = await fetch(`${config.socialServiceUrl}/internal/likes/count/${recipeId}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { count: number };
    return data.count;
  } catch (err) {
    console.error('⚠️  Social Service недоступен (fetchLikesCount):', (err as Error).message);
    return 0;
  }
}

export async function fetchLikesCounts(recipeIds: number[]): Promise<Map<number, number>> {
  const unique = [...new Set(recipeIds)];
  if (unique.length === 0) return new Map();
  try {
    const res = await fetch(`${config.socialServiceUrl}/internal/likes/counts?recipeIds=${unique.join(',')}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    if (!res.ok) throw new Error(`Social Service ответил ${res.status}`);
    const rows = (await res.json()) as { recipeId: number; count: number }[];
    return new Map(rows.map((r) => [r.recipeId, r.count]));
  } catch (err) {
    console.error('⚠️  Social Service недоступен (fetchLikesCounts):', (err as Error).message);
    return new Map(unique.map((id) => [id, 0]));
  }
}

export async function fetchInteractions(
  recipeId: number,
  userId: number
): Promise<{ isLiked: boolean; isFavorite: boolean } | undefined> {
  try {
    const res = await fetch(
      `${config.socialServiceUrl}/internal/interactions?recipeId=${recipeId}&userId=${userId}`,
      { headers: { 'X-Internal-Api-Key': config.internalApiKey } }
    );
    if (!res.ok) return undefined;
    return (await res.json()) as { isLiked: boolean; isFavorite: boolean };
  } catch (err) {
    console.error('⚠️  Social Service недоступен (fetchInteractions):', (err as Error).message);
    return undefined;
  }
}

// Примечание (ДЗ5): раньше здесь была функция deleteInteractions(), делавшая
// синхронный HTTP-вызов Social Service при удалении рецепта. Теперь для этого
// используется событие recipe.deleted через RabbitMQ (см. ../queue/rabbitmq.ts) —
// см. recipeService.deleteRecipe().
