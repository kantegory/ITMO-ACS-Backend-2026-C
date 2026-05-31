"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUserServiceConsumer = startUserServiceConsumer;
const connection_1 = require("./connection");
async function startUserServiceConsumer() {
    await (0, connection_1.consumeEvents)(connection_1.EXCHANGES.RECIPE, connection_1.QUEUES.USER_RECIPE_DELETED, ['recipe.deleted'], async (data) => {
        console.log(`Recipe deleted event received:`, data);
    });
}
