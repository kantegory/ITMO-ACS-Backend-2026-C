"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const typeorm_1 = require("typeorm");
const User_1 = require("./entity/User");
const routes_1 = __importDefault(require("./routes"));
exports.AppDataSource = new typeorm_1.DataSource({ type: "postgres", host: process.env.DB_HOST || "localhost", port: +(process.env.DB_PORT || "5433"), username: process.env.DB_USER || "postgres", password: process.env.DB_PASSWORD || "311202", database: process.env.DB_NAME || "recipes_users", synchronize: true, logging: false, entities: [User_1.User] });
exports.AppDataSource.initialize().then(() => { const app = (0, express_1.default)(); app.use((0, cors_1.default)()); app.use(express_1.default.json()); app.use(routes_1.default); app.listen(3001, () => console.log("UserService: http://localhost:3001")); }).catch(e => console.error("UserService DB error", e));
