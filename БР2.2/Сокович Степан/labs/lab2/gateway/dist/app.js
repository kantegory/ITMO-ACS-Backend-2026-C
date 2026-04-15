"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const proxy_routes_1 = require("./proxy-routes");
class App {
    constructor(port = config_1.config.port) {
        this.port = port;
        this.app = this.configureApp();
    }
    configureApp() {
        const app = (0, express_1.default)();
        app.get("/", (req, res) => {
            res.json({
                service: "API-шлюз аренды жилья (ЛР2)",
                services: {
                    users: config_1.config.userServiceUrl,
                    rent: config_1.config.rentServiceUrl,
                    communication: config_1.config.commServiceUrl,
                },
            });
        });
        app.use(proxy_routes_1.proxyRoutes);
        return app;
    }
    start() {
        this.app.listen(this.port, () => {
            console.log(`gateway listening on ${this.port}`);
        });
    }
}
const app = new App();
app.start();
exports.default = app;
