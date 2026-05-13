import "reflect-metadata";
import express from "express";
import { AuthDataSource } from "./database";
import { AuthController } from "./controllers/AuthController";

const app = express();
app.use(express.json());

// Маршруты
app.post("/register", AuthController.register);
app.post("/login", AuthController.login);
app.post("/internal/validate", AuthController.validateToken); // для других сервисов

AuthDataSource.initialize().then(() => {
    console.log("Auth DB Connected");
    app.listen(4001, () => console.log("Auth Service running on port 4001"));
}).catch(console.error);