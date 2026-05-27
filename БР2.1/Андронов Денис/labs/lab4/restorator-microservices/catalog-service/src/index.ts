import "reflect-metadata";
import express from "express";
import { CatalogDataSource } from "./database";
import { RestaurantController } from "./controllers/RestaurantController";
import { startCatalogConsumer } from "./consumers/catalogConsumer";

const app = express();
app.use(express.json());

app.post("/restaurants", RestaurantController.create);

CatalogDataSource.initialize()
    .then(async () => {
        console.log("Catalog DB Connected");
        await startCatalogConsumer();
        app.listen(4002, () => console.log("Catalog Service running on port 4002"));
    })
    .catch(console.error);
