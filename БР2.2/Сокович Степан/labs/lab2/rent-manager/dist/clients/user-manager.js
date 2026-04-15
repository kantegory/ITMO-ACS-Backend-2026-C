"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUsersExist = assertUsersExist;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const internalAxios = axios_1.default.create({
    baseURL: config_1.config.userManagerUrl,
    headers: { Authorization: `Bearer ${config_1.config.internalToken}` },
    validateStatus: () => true,
});
async function assertUsersExist(ids) {
    const q = ids.join(",");
    const r = await internalAxios.get(`/internal/users/exists?ids=${encodeURIComponent(q)}`);
    if (r.status !== 200 || !r.data?.exists) {
        return false;
    }
    return ids.every((id) => r.data.exists[id] === true);
}
