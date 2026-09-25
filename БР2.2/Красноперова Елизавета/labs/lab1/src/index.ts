import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Recipe } from "./entity/Recipe";
import { Step } from "./entity/Step";
import { Ingredient } from "./entity/Ingredient";
import { RecipeIngredient } from "./entity/RecipeIngredient";
import { Comment } from "./entity/Comment";
import { Like } from "./entity/Like";
import { SavedRecipe } from "./entity/SavedRecipe";
import { Subscription } from "./entity/Subscription";
import authRoutes from "./routes/auth";
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/users";
import socialRoutes from "./routes/social";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: "311202",
    database: "recipes-api2",
    synchronize: true, 
    logging: false,
    entities: [User, Recipe, Step, Ingredient, RecipeIngredient, Comment, Like, SavedRecipe, Subscription]
});

AppDataSource.initialize()
    .then(() => {
        console.log("База данных подключена");

        const app = express();
        app.use(cors());
        app.use(express.json());

        app.use("/api/auth", authRoutes);
        app.use("/api/recipes", recipeRoutes);
        app.use("/api/users", userRoutes);
        app.use("/api", socialRoutes);

        app.listen(3000, () => {
            console.log("Сервер запущен на http://localhost:3000");
        });
    })
    .catch((error) => console.log("Ошибка подключения к БД:", error));