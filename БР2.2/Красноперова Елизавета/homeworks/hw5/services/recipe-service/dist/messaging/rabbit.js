"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RABBITMQ_URL = exports.RABBIT_EXCHANGE = void 0;
exports.publishEvent = publishEvent;
exports.startConsumer = startConsumer;
const amqp = require("amqplib");
exports.RABBIT_EXCHANGE = process.env.RABBITMQ_EXCHANGE || "recipes.events";
exports.RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
let connection = null;
let channel = null;
let connecting = null;
async function getChannel() {
    if (channel)
        return channel;
    if (connecting)
        return connecting;
    connecting = (async () => {
        const conn = await amqp.connect(exports.RABBITMQ_URL);
        connection = conn;
        conn.on("close", () => { connection = null; channel = null; });
        conn.on("error", (error) => console.error("RabbitMQ connection error:", error.message));
        const ch = await conn.createChannel();
        await ch.assertExchange(exports.RABBIT_EXCHANGE, "topic", { durable: true });
        channel = ch;
        return ch;
    })();
    try {
        return await connecting;
    }
    finally {
        connecting = null;
    }
}
async function publishEvent(routingKey, payload) {
    try {
        const ch = await getChannel();
        ch.publish(exports.RABBIT_EXCHANGE, routingKey, Buffer.from(JSON.stringify({
            event_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            occurred_at: new Date().toISOString(), ...payload
        })), { persistent: true, contentType: "application/json" });
    }
    catch (error) {
        console.error(`RabbitMQ publish failed (${routingKey}):`, (error === null || error === void 0 ? void 0 : error.message) || error);
    }
}
async function startConsumer(queueName, routingKeys, handler) {
    while (true) {
        try {
            const ch = await getChannel();
            await ch.assertQueue(queueName, { durable: true });
            for (const key of routingKeys)
                await ch.bindQueue(queueName, exports.RABBIT_EXCHANGE, key);
            await ch.prefetch(10);
            await ch.consume(queueName, async (message) => {
                if (!message)
                    return;
                try {
                    await handler(JSON.parse(message.content.toString("utf8")));
                    ch.ack(message);
                }
                catch (error) {
                    console.error(`RabbitMQ handler failed (${queueName}):`, error);
                    ch.nack(message, false, false);
                }
            });
            console.log(`RabbitMQ consumer started: ${queueName}`);
            return;
        }
        catch (error) {
            console.error(`RabbitMQ consumer connection failed (${queueName}):`, (error === null || error === void 0 ? void 0 : error.message) || error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
