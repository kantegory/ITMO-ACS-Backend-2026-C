import "reflect-metadata";
import express from "express";
import { AuthDataSource } from "./database";
import { AuthController } from "./controllers/AuthController";
import { startAuthConsumer } from "./consumers/authConsumer";

const app = express();
app.use(express.json());

app.post("/register", AuthController.register);
app.post("/login", AuthController.login);

AuthDataSource.initialize()
    .then(async () => {
        console.log("Auth DB Connected");
        await startAuthConsumer();
        app.listen(4001, () => console.log("Auth Service running on port 4001"));
    })
    .catch(console.error);
