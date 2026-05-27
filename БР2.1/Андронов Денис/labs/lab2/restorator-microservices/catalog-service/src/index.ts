import "reflect-metadata";
import express from "express";
import { CatalogDataSource } from "./database";
import { RestaurantController } from "./controllers/RestaurantController";

const app = express();
app.use(express.json());

app.post("/restaurants", RestaurantController.create);
app.get("/internal/restaurants/:id/check", RestaurantController.checkRestaurant);

CatalogDataSource.initialize().then(() => {
    console.log("Catalog DB Connected");
    app.listen(4002, () => console.log("Catalog Service running on port 4002"));
}).catch(console.error);