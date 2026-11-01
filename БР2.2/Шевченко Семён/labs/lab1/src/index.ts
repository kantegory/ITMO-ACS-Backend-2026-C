import express from "express";
import { db } from "./database";
import routes from "./routes";
import { errors } from "./middleware";

const app = express();
app.use(express.json());
app.use("/api", routes);
app.use(errors);

db.initialize().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log("API: http://localhost:" + (process.env.PORT || 3000)));
}).catch(error => { console.error(error); process.exit(1); });
