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
const Recipe_1 = require("./entity/Recipe");
const Step_1 = require("./entity/Step");
const Ingredient_1 = require("./entity/Ingredient");
const RecipeIngredient_1 = require("./entity/RecipeIngredient");
const Comment_1 = require("./entity/Comment");
const Like_1 = require("./entity/Like");
const SavedRecipe_1 = require("./entity/SavedRecipe");
const Subscription_1 = require("./entity/Subscription");
const auth_1 = __importDefault(require("./routes/auth"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const users_1 = __importDefault(require("./routes/users"));
const social_1 = __importDefault(require("./routes/social"));
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: "311202",
    database: "recipes-api2",
    synchronize: true,
    logging: false,
    entities: [User_1.User, Recipe_1.Recipe, Step_1.Step, Ingredient_1.Ingredient, RecipeIngredient_1.RecipeIngredient, Comment_1.Comment, Like_1.Like, SavedRecipe_1.SavedRecipe, Subscription_1.Subscription]
});
exports.AppDataSource.initialize()
    .then(() => {
    console.log("База данных подключена");
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use("/api/auth", auth_1.default);
    app.use("/api/recipes", recipes_1.default);
    app.use("/api/users", users_1.default);
    app.use("/api", social_1.default);
    app.listen(3000, () => {
        console.log("Сервер запущен на http://localhost:3000");
    });
})
    .catch((error) => console.log("Ошибка подключения к БД:", error));
