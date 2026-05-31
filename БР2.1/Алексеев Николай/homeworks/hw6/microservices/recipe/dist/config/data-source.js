"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const Recipe_1 = require("../entities/Recipe");
const Step_1 = require("../entities/Step");
const Ingredient_1 = require("../entities/Ingredient");
const Cuisine_1 = require("../entities/Cuisine");
const TypeRecipe_1 = require("../entities/TypeRecipe");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'recipe_db',
    synchronize: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'production',
    entities: [Recipe_1.Recipe, Step_1.Step, Ingredient_1.Ingredient, Cuisine_1.Cuisine, TypeRecipe_1.TypeRecipe],
});
