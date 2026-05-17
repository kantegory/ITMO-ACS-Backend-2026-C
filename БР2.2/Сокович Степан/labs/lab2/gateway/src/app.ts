import express, { Request, Response } from "express";
import { config } from "./config";
import { proxyRoutes } from "./proxy-routes";

class App {
  private app: express.Application;

  private readonly port: number;

  constructor(port = config.port) {
    this.port = port;
    this.app = this.configureApp();
  }

  private configureApp(): express.Application {
    const app = express();

    app.get("/", (req: Request, res: Response) => {
      res.json({
        service: "API-шлюз аренды жилья (ЛР2)",
        services: {
          users: config.userServiceUrl,
          rent: config.rentServiceUrl,
          communication: config.commServiceUrl,
        },
      });
    });

    app.use(proxyRoutes);

    return app;
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`gateway listening on ${this.port}`);
    });
  }
}

const app = new App();
app.start();

export default app;
