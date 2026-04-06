import app from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";

const PORT = env.PORT;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
