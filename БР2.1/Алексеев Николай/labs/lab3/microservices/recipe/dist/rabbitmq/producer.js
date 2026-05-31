"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeCreated = recipeCreated;
exports.recipeDeleted = recipeDeleted;
const connection_1 = require("./connection");
async function recipeCreated(recipeId, authorId, title) {
    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_CREATED, {
        recipeId,
        authorId,
        title,
        timestamp: new Date().toISOString(),
    });
}
async function recipeDeleted(recipeId) {
    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.RECIPE, connection_1.EVENT_TYPES.RECIPE_DELETED, {
        recipeId,
        timestamp: new Date().toISOString(),
    });
}
