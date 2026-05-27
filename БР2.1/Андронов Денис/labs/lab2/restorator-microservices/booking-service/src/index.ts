import "reflect-metadata";
import express from "express";
import { BookingDataSource } from "./database";
import { BookingController } from "./controllers/BookingController";

const app = express();
app.use(express.json());

// основной эндпоинт
app.post("/reservations", BookingController.create);

BookingDataSource.initialize().then(() => {
    console.log("Booking DB Connected");
    app.listen(4003, () => console.log("Booking Service running on port 4003"));
}).catch(console.error);