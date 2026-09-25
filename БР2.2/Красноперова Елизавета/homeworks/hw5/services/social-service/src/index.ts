import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { Like } from "./entity/Like";
import { SavedRecipe } from "./entity/SavedRecipe";
import { Comment } from "./entity/Comment";
import { Subscription } from "./entity/Subscription";
import routes from "./routes";
import { startConsumer } from "./messaging/rabbit";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: +(process.env.DB_PORT || "5433"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "311202",
  database: process.env.DB_NAME || "recipes_social",
  synchronize: true,
  logging: false,
  entities: [Like, SavedRecipe, Comment, Subscription]
});

async function startRabbitConsumer() {
  await startConsumer("social-service.recipe-events", ["recipe.deleted"], async (event: any) => {
    if (event.type !== "recipe.deleted") return;
    const recipeId = Number(event.recipe_id);
    await AppDataSource.getRepository(Like).delete({ recipe_id: recipeId });
    await AppDataSource.getRepository(SavedRecipe).delete({ recipe_id: recipeId });
    await AppDataSource.getRepository(Comment).delete({ recipe_id: recipeId });
    console.log(`RabbitMQ event processed: recipe.deleted (${recipeId})`);
  });
}

AppDataSource.initialize().then(async () => {
  startRabbitConsumer().catch(error => console.error("SocialService RabbitMQ consumer stopped:", error));
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(routes);
  app.listen(3003, () => console.log("SocialService: http://localhost:3003"));
}).catch(e => console.error("SocialService DB error", e));
