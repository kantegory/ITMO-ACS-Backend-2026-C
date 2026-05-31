import { consumeEvents, EXCHANGES, QUEUES } from './connection';
import { AppDataSource } from '../config/data-source';

export async function startEngagementConsumer() {
  await consumeEvents(
    EXCHANGES.RECIPE,
    QUEUES.ENGAGEMENT_RECIPE_CREATED,
    ['recipe.created'],
    async (data) => {
      console.log(`Recipe created event received:`, data);
    }
  );

  await consumeEvents(
    EXCHANGES.RECIPE,
    QUEUES.ENGAGEMENT_RECIPE_DELETED,
    ['recipe.deleted'],
    async (data) => {
      console.log(`Recipe deleted event received:`, data);
      
      const likeRepo = AppDataSource.getRepository('Like');
      const dislikeRepo = AppDataSource.getRepository('Dislike');
      const savedRepo = AppDataSource.getRepository('SavedRecipe');
      const commentRepo = AppDataSource.getRepository('Comment');
      
      await likeRepo.delete({ recipeId: data.recipeId });
      await dislikeRepo.delete({ recipeId: data.recipeId });
      await savedRepo.delete({ recipeId: data.recipeId });
      await commentRepo.delete({ recipeId: data.recipeId });
      
      console.log(`Cleaned all interactions for recipe ${data.recipeId}`);
    }
  );

  await consumeEvents(
    EXCHANGES.USER,
    QUEUES.ENGAGEMENT_USER_DELETED,
    ['user.deleted'],
    async (data) => {
      console.log(`User deleted event received:`, data);
      
      const likeRepo = AppDataSource.getRepository('Like');
      const dislikeRepo = AppDataSource.getRepository('Dislike');
      const savedRepo = AppDataSource.getRepository('SavedRecipe');
      const commentRepo = AppDataSource.getRepository('Comment');
      
      await likeRepo.delete({ userId: data.userId });
      await dislikeRepo.delete({ userId: data.userId });
      await savedRepo.delete({ userId: data.userId });
      await commentRepo.delete({ userId: data.userId });
      
      console.log(`Cleaned all interactions for user ${data.userId}`);
    }
  );
}