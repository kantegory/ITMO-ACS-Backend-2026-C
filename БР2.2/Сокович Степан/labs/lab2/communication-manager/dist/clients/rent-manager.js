"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertListingExists = assertListingExists;
exports.assertDealVisible = assertDealVisible;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const rentAxios = axios_1.default.create({
    baseURL: config_1.config.rentManagerUrl,
    validateStatus: () => true,
});
async function assertListingExists(listingId) {
    const r = await rentAxios.get(`/listings/${listingId}`);
    return r.status === 200;
}
async function assertDealVisible(dealId, bearerAuthHeader) {
    const r = await rentAxios.get("/deals", {
        headers: { Authorization: bearerAuthHeader },
    });
    if (r.status !== 200 || !Array.isArray(r.data?.data)) {
        return false;
    }
    return r.data.data.some((d) => d.id === dealId);
}
