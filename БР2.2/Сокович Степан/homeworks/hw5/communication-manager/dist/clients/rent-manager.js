"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertListingExists = assertListingExists;
exports.assertDealVisible = assertDealVisible;
const config_1 = require("../config");
const kafka_rpc_client_1 = require("../kafka-rpc-client");
async function assertListingExists(listingId) {
    const response = await (0, kafka_rpc_client_1.rpcCall)(config_1.config.rentRpcTopic, "listings.exists", {
        listingId,
    });
    return response?.exists === true;
}
async function assertDealVisible(dealId, userId) {
    const response = await (0, kafka_rpc_client_1.rpcCall)(config_1.config.rentRpcTopic, "deals.visible", { dealId, userId });
    return response?.visible === true;
}
