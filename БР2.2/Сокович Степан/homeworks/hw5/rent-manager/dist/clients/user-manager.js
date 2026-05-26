"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUsersExist = assertUsersExist;
const config_1 = require("../config");
const kafka_rpc_client_1 = require("../kafka-rpc-client");
async function assertUsersExist(ids) {
    const response = await (0, kafka_rpc_client_1.rpcCall)(config_1.config.userRpcTopic, "users.exists", { ids });
    if (!response?.exists) {
        return false;
    }
    return ids.every((id) => response.exists?.[id] === true);
}
