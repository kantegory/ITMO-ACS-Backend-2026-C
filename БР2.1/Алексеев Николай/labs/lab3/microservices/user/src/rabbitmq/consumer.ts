import { consumeEvents, EXCHANGES, QUEUES } from './connection';

export async function startUserServiceConsumer() {
  await consumeEvents(
    EXCHANGES.RECIPE,
    QUEUES.USER_RECIPE_DELETED,
    ['recipe.deleted'],
    async (data) => {
      console.log(`Recipe deleted event received:`, data);
    }
  );
}