import "reflect-metadata";
import express from "express";
import cors from "cors";
import { createServer, Server } from "http";

import routes from "./routes";
import dataSource from "./config/data-source";
import { initKafka, startKafkaConsumer } from "common";
import { initListeners } from "./listeners";

class App {
  public port: number;
  public host: string;

  private app: express.Application;
  private server: Server;

  constructor(port = 8002, host = "localhost") {
    this.port = port;
    this.host = host;

    this.app = this.createApp();
    this.server = this.createServer();
  }

  private createApp(): express.Application {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/api", routes);

    return app;
  }

  private createServer(): Server {
    const server = createServer(this.app);

    return server;
  }

  public async start(): Promise<void> {
    try {
      await dataSource.initialize();
      console.log("Data Source has been initialized!");

      await initKafka("rent-service", "rent-service-group");
      console.log("Kafka has been initialized!");

      await initListeners();
      console.log("Listeners have been initialized!");

      await startKafkaConsumer();
      console.log("Kafka consumer started!");

      this.server.listen(this.port, () => {
        console.log(`Running server on port ${this.port}`);
      });
    } catch (err) {
      console.error("Startup failed:", err);
      process.exit(1);
    }
  }
}

const app = new App();

app.start().catch((err) => {
  console.error("Fatal error during app startup:", err);
  process.exit(1);
});
