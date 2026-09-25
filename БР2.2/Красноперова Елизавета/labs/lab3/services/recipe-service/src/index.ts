import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { Recipe } from "./entity/Recipe";
import { Step } from "./entity/Step";
import { Ingredient } from "./entity/Ingredient";
import { RecipeIngredient } from "./entity/RecipeIngredient";
import { RecipeSocialStats } from "./entity/RecipeSocialStats";
import routes from "./routes";
import { startConsumer } from "./messaging/rabbit";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: +(process.env.DB_PORT || "5433"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "311202",
  database: process.env.DB_NAME || "recipes_recipes",
  synchronize: true,
  logging: false,
  entities: [Recipe, Step, Ingredient, RecipeIngredient, RecipeSocialStats]
});

async function startRabbitConsumer() {
  await startConsumer("recipe-service.social-updates", ["recipe.social.updated", "recipe.deleted"], async (event: any) => {
    if (event.type === "recipe.deleted" || event.recipe_id && event.deleted === true) {
      await AppDataSource.getRepository(RecipeSocialStats).delete({ recipe_id: Number(event.recipe_id) });
      return;
    }
    if (event.type !== "recipe.social.updated") return;
    const repo = AppDataSource.getRepository(RecipeSocialStats);
    await repo.upsert({
      recipe_id: Number(event.recipe_id),
      likes_count: Number(event.likes_count || 0),
      comments_count: Number(event.comments_count || 0),
      saved_count: Number(event.saved_count || 0)
    }, ["recipe_id"]);
  });
}

AppDataSource.initialize().then(async () => {
  startRabbitConsumer().catch(error => console.error("RecipeService RabbitMQ consumer stopped:", error));
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(routes);
  app.listen(3002, () => console.log("RecipeService: http://localhost:3002"));
}).catch(e => console.error("RecipeService DB error", e));
