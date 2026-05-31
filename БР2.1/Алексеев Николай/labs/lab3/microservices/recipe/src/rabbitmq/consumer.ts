import { consumeEvents, EXCHANGES, QUEUES } from './connection';
import { AppDataSource } from '../config/data-source';
import { Recipe } from '../entities/Recipe';

export async function startRecipeConsumer() {
  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_COMMENT_UPDATED,
    ['recipe.commented'],
    async (data) => {
      console.log(`Comment added to recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.increment({ id: data.recipeId }, 'comments', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_COMMENT_UPDATED,
    ['recipe.comment.deleted'],
    async (data) => {
      console.log(`Comment deleted from recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.decrement({ id: data.recipeId }, 'comments', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_LIKE_UPDATED,
    ['recipe.liked'],
    async (data) => {
      console.log(`Like added to recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.increment({ id: data.recipeId }, 'likes', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_LIKE_UPDATED,
    ['recipe.unliked'],
    async (data) => {
      console.log(`Like removed from recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.decrement({ id: data.recipeId }, 'likes', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_LIKE_UPDATED,
    ['recipe.disliked'],
    async (data) => {
      console.log(`Dislike added to recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.increment({ id: data.recipeId }, 'dislikes', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_LIKE_UPDATED,
    ['recipe.undisliked'],
    async (data) => {
      console.log(`Dislike removed from recipe ${data.recipeId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.decrement({ id: data.recipeId }, 'dislikes', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_SAVE_UPDATED,
    ['recipe.saved'],
    async (data) => {
      console.log(`Recipe ${data.recipeId} saved by user ${data.userId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.increment({ id: data.recipeId }, 'saves', 1);
    }
  );

  await consumeEvents(
    EXCHANGES.ENGAGEMENT,
    QUEUES.RECIPE_SAVE_UPDATED,
    ['recipe.unsaved'],
    async (data) => {
      console.log(`Recipe ${data.recipeId} unsaved by user ${data.userId}`);
      const recipeRepo = AppDataSource.getRepository(Recipe);
      await recipeRepo.decrement({ id: data.recipeId }, 'saves', 1);
    }
  );
}