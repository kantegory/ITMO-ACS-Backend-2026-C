import express from "express";
import { db } from "./database";
import { auth, errors } from "./middleware";
import { BookingController as Bookings } from "./controllers/BookingController";

const app = express();
app.use(express.json());
app.get("/api/bookings/availability", Bookings.availability);
app.get("/api/bookings/restaurant", auth, Bookings.forRestaurant);
app.patch("/api/bookings/:id/status", auth, Bookings.changeStatus);
app.post("/api/bookings", auth, Bookings.create);
app.get("/api/bookings", auth, Bookings.mine);
app.delete("/api/bookings/:id", auth, Bookings.cancel);
app.use(errors);
db.initialize().then(() => app.listen(process.env.PORT || 3003)).catch(error => { console.error(error); process.exit(1); });
