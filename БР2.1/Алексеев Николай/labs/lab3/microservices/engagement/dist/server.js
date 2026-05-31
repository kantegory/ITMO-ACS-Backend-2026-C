"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./config/data-source");
const reaction_routes_1 = __importDefault(require("./routes/reaction.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const save_routes_1 = __importDefault(require("./routes/save.routes"));
const connection_1 = require("./rabbitmq/connection");
const consumer_1 = require("./rabbitmq/consumer");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8003;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/api/recipes', reaction_routes_1.default);
app.use('/api/recipes', comment_routes_1.default);
app.use('/api/recipes', save_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'engagement-service' });
});
data_source_1.AppDataSource.initialize()
    .then(async () => {
    await (0, connection_1.connectRabbitMQ)();
    await (0, consumer_1.startEngagementConsumer)();
    console.log(`Engagement Service running on port ${PORT}`);
    app.listen(PORT);
})
    .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});
