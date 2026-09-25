const amqp: any = require("amqplib");
export const RABBIT_EXCHANGE = process.env.RABBITMQ_EXCHANGE || "recipes.events";
export const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
let connection: any = null;
let channel: any = null;
let connecting: Promise<any> | null = null;
async function getChannel() {
    if (channel) return channel;
    if (connecting) return connecting;
    connecting = (async () => {
        const conn = await amqp.connect(RABBITMQ_URL);
        connection = conn;
        conn.on("close", () => { connection = null; channel = null; });
        conn.on("error", (error: any) => console.error("RabbitMQ connection error:", error.message));
        const ch = await conn.createChannel();
        await ch.assertExchange(RABBIT_EXCHANGE, "topic", { durable: true });
        channel = ch;
        return ch;
    })();
    try { return await connecting; } finally { connecting = null; }
}
export async function publishEvent(routingKey: string, payload: Record<string, unknown>) {
    try {
        const ch = await getChannel();
        ch.publish(RABBIT_EXCHANGE, routingKey, Buffer.from(JSON.stringify({
            event_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            occurred_at: new Date().toISOString(), ...payload
        })), { persistent: true, contentType: "application/json" });
    } catch (error: any) { console.error(`RabbitMQ publish failed (${routingKey}):`, error?.message || error); }
}
export async function startConsumer(queueName: string, routingKeys: string[], handler: (payload: any) => Promise<void>) {
    while (true) {
        try {
            const ch = await getChannel();
            await ch.assertQueue(queueName, { durable: true });
            for (const key of routingKeys) await ch.bindQueue(queueName, RABBIT_EXCHANGE, key);
            await ch.prefetch(10);
            await ch.consume(queueName, async (message: any) => {
                if (!message) return;
                try { await handler(JSON.parse(message.content.toString("utf8"))); ch.ack(message); }
                catch (error) { console.error(`RabbitMQ handler failed (${queueName}):`, error); ch.nack(message, false, false); }
            });
            console.log(`RabbitMQ consumer started: ${queueName}`);
            return;
        } catch (error: any) {
            console.error(`RabbitMQ consumer connection failed (${queueName}):`, error?.message || error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
