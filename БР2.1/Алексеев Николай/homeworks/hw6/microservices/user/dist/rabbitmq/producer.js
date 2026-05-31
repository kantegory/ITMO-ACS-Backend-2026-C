"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCreated = userCreated;
exports.userDeleted = userDeleted;
const connection_1 = require("./connection");
async function userCreated(userId, login, email) {
    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.USER, connection_1.EVENT_TYPES.USER_CREATED, {
        userId,
        login,
        email,
        timestamp: new Date().toISOString(),
    });
}
async function userDeleted(userId) {
    await (0, connection_1.publishEvent)(connection_1.EXCHANGES.USER, connection_1.EVENT_TYPES.USER_DELETED, {
        userId,
        timestamp: new Date().toISOString(),
    });
}
