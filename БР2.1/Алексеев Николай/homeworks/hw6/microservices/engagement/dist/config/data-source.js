"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const Reaction_1 = require("../entities/Reaction");
const SavedRecipe_1 = require("../entities/SavedRecipe");
const Comment_1 = require("../entities/Comment");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'engagement_db',
    synchronize: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'production',
    entities: [Reaction_1.Reaction, SavedRecipe_1.SavedRecipe, Comment_1.Comment],
});
