import express from "express";
import { db } from "./database";
import { auth, errors } from "./middleware";
import { UserController as Users } from "./controllers/UserController";

const app = express();
app.use(express.json());
app.post("/api/auth/register", Users.register);
app.post("/api/auth/login", Users.login);
app.get("/api/users/me", auth, Users.me);
app.patch("/api/users/me", auth, Users.update);
app.use(errors);
db.initialize().then(() => app.listen(process.env.PORT || 3001)).catch(error => { console.error(error); process.exit(1); });
