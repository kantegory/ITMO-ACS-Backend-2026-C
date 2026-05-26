"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const config_1 = require("./config");
const retry_1 = require("./utils/retry");
const routes_1 = require("./routes");
class App {
    constructor(port = config_1.config.port) {
        this.port = port;
        this.app = this.configureApp();
    }
    configureApp() {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        (0, routes_1.registerRoutes)(app);
        app.use((err, req, res, next) => {
            console.error(err);
            res.status(500).json({ message: "internal error" });
        });
        return app;
    }
    async start() {
        await (0, retry_1.retry)(async () => (0, db_1.initDb)());
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
exports.default = app;
