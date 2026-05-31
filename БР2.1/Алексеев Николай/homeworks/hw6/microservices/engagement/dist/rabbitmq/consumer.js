"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEngagementConsumer = startEngagementConsumer;
const connection_1 = require("./connection");
const data_source_1 = require("../config/data-source");
async function startEngagementConsumer() {
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.RECIPE, connection_1.QUEUES.ENGAGEMENT_RECIPE_CREATED, ['recipe.created'], async (data) => {
        console.log(`Recipe created event received:`, data);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.RECIPE, connection_1.QUEUES.ENGAGEMENT_RECIPE_DELETED, ['recipe.deleted'], async (data) => {
        console.log(`Recipe deleted event received:`, data);
        const likeRepo = data_source_1.AppDataSource.getRepository('Like');
        const dislikeRepo = data_source_1.AppDataSource.getRepository('Dislike');
        const savedRepo = data_source_1.AppDataSource.getRepository('SavedRecipe');
        const commentRepo = data_source_1.AppDataSource.getRepository('Comment');
        await likeRepo.delete({ recipeId: data.recipeId });
        await dislikeRepo.delete({ recipeId: data.recipeId });
        await savedRepo.delete({ recipeId: data.recipeId });
        await commentRepo.delete({ recipeId: data.recipeId });
        console.log(`Cleaned all interactions for recipe ${data.recipeId}`);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.USER, connection_1.QUEUES.ENGAGEMENT_USER_DELETED, ['user.deleted'], async (data) => {
        console.log(`User deleted event received:`, data);
        const likeRepo = data_source_1.AppDataSource.getRepository('Like');
        const dislikeRepo = data_source_1.AppDataSource.getRepository('Dislike');
        const savedRepo = data_source_1.AppDataSource.getRepository('SavedRecipe');
        const commentRepo = data_source_1.AppDataSource.getRepository('Comment');
        await likeRepo.delete({ userId: data.userId });
        await dislikeRepo.delete({ userId: data.userId });
        await savedRepo.delete({ userId: data.userId });
        await commentRepo.delete({ userId: data.userId });
        console.log(`Cleaned all interactions for user ${data.userId}`);
    });
}
