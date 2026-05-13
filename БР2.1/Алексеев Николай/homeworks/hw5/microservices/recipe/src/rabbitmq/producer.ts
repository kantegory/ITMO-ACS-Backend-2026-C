import { publishEvent, EXCHANGES, EVENT_TYPES } from './connection';

export async function recipeCreated(recipeId: number, authorId: number, title: string) {
  await publishEvent(EXCHANGES.RECIPE, EVENT_TYPES.RECIPE_CREATED, {
    recipeId,
    authorId,
    title,
    timestamp: new Date().toISOString(),
  });
}

export async function recipeDeleted(recipeId: number) {
  await publishEvent(EXCHANGES.RECIPE, EVENT_TYPES.RECIPE_DELETED, {
    recipeId,
    timestamp: new Date().toISOString(),
  });
}