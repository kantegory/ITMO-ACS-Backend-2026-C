"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRecipeConsumer = startRecipeConsumer;
const connection_1 = require("./connection");
const data_source_1 = require("../config/data-source");
const Recipe_1 = require("../entities/Recipe");
async function startRecipeConsumer() {
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_COMMENT_UPDATED, ['recipe.commented'], async (data) => {
        console.log(`Comment added to recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.increment({ id: data.recipeId }, 'comments', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_COMMENT_UPDATED, ['recipe.comment.deleted'], async (data) => {
        console.log(`Comment deleted from recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.decrement({ id: data.recipeId }, 'comments', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_LIKE_UPDATED, ['recipe.liked'], async (data) => {
        console.log(`Like added to recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.increment({ id: data.recipeId }, 'likes', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_LIKE_UPDATED, ['recipe.unliked'], async (data) => {
        console.log(`Like removed from recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.decrement({ id: data.recipeId }, 'likes', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_LIKE_UPDATED, ['recipe.disliked'], async (data) => {
        console.log(`Dislike added to recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.increment({ id: data.recipeId }, 'dislikes', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_LIKE_UPDATED, ['recipe.undisliked'], async (data) => {
        console.log(`Dislike removed from recipe ${data.recipeId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.decrement({ id: data.recipeId }, 'dislikes', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_SAVE_UPDATED, ['recipe.saved'], async (data) => {
        console.log(`Recipe ${data.recipeId} saved by user ${data.userId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.increment({ id: data.recipeId }, 'saves', 1);
    });
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.ENGAGEMENT, connection_1.QUEUES.RECIPE_SAVE_UPDATED, ['recipe.unsaved'], async (data) => {
        console.log(`Recipe ${data.recipeId} unsaved by user ${data.userId}`);
        const recipeRepo = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
        await recipeRepo.decrement({ id: data.recipeId }, 'saves', 1);
    });
}
