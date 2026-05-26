import express, { NextFunction, Request, Response } from "express";
import { initDb } from "./db";
import { config } from "./config";
import { retry } from "./utils/retry";
import { registerRoutes } from "./routes";

class App {
  private app: express.Application;

  private readonly port: number;

  constructor(port = config.port) {
    this.port = port;
    this.app = this.configureApp();
  }

  private configureApp(): express.Application {
    const app = express();
    app.use(express.json());

    registerRoutes(app);

    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      res.status(500).json({ message: "internal error" });
    });

    return app;
  }

  public async start(): Promise<void> {
    await retry(async () => initDb());
    this.app.listen(this.port, () => {
      console.log(`rent-manager listening on ${this.port}`);
    });
  }
}

const app = new App();
app.start().catch((e) => {
  console.error(e);
  process.exit(1);
});

export default app;
