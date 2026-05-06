import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./database"; // импортируем из файла
import routes from "./routes/index";

const app = express();
app.use(express.json());
app.use("/", routes);

AppDataSource.initialize()
    .then(() => {
        console.log("бд подключена");
        app.listen(process.env.PORT || 3000, () => {
            console.log("сервер запущен");
        });
    })
    .catch((error) => console.log("ошибка бд:", error));