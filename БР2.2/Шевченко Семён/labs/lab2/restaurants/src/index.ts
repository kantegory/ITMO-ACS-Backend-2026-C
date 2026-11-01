import { bookingOptions, loadCatalog } from "./catalog";
import { text, uuid } from "./validation";
import express from "express";
import { db } from "./database";
import { errors } from "./middleware";
import { RestaurantController as Restaurants } from "./controllers/RestaurantController";
import { consumeBookings } from "./queue";

const app = express();
app.use(express.json());
app.get("/api/cities", Restaurants.cities);
app.get("/api/cuisines", Restaurants.cuisines);
app.get("/api/restaurants", Restaurants.list);
app.get("/api/restaurants/:id", Restaurants.detail);
app.use("/internal", (req, res, next) => {
  if (!process.env.INTERNAL_KEY || req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(401).json({ message: "Неверный внутренний ключ" });
  }
  next();
});
app.get("/internal/booking-options", async (req, res) => {
  res.json(await bookingOptions(uuid(req.query.table_id, "table_id")!, uuid(req.query.time_slot_id, "time_slot_id")!));
});
app.get("/internal/restaurants", async (req, res) => {
  res.json(await loadCatalog({ restaurant_id: uuid(req.query.restaurant_id, "restaurant_id", false), name: text(req.query.name, "name") }));
});
app.use(errors);
db.initialize().then(async () => {
  await consumeBookings();
  app.listen(process.env.PORT || 3002);
}).catch(error => { console.error(error); process.exit(1); });
