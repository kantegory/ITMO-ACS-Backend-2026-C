import amqp, { ConsumeMessage } from "amqplib";
import { randomUUID } from "crypto";

export const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

export const QUEUES = {
    AUTH_VALIDATE: "auth.validate.token",
    CATALOG_CHECK: "catalog.restaurant.check",
} as const;

export const EXCHANGES = {
    RESERVATION: "reservation.events",
} as const;

export const ROUTING_KEYS = {
    RESERVATION_CREATED: "reservation.created",
} as const;

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;

export async function getChannel(): Promise<AmqpChannel> {
    if (channel) {
        return channel;
    }

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    return channel;
}

export async function setupRpcServer(
    queue: string,
    handler: (payload: unknown) => Promise<unknown>
): Promise<void> {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });
    ch.prefetch(1);

    ch.consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) {
            return;
        }

        try {
            const payload = JSON.parse(msg.content.toString());
            const result = await handler(payload);

            if (msg.properties.replyTo) {
                ch.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify(result)),
                    { correlationId: msg.properties.correlationId }
                );
            }

            ch.ack(msg);
        } catch {
            ch.nack(msg, false, false);
        }
    });
}

export async function rpcCall<T>(
    queue: string,
    payload: unknown,
    timeoutMs = 5000
): Promise<T> {
    const ch = await getChannel();
    const correlationId = randomUUID();
    const { queue: replyQueue } = await ch.assertQueue("", { exclusive: true });

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`RPC timeout: ${queue}`));
        }, timeoutMs);

        ch.consume(
            replyQueue,
            (msg: ConsumeMessage | null) => {
                if (msg && msg.properties.correlationId === correlationId) {
                    clearTimeout(timer);
                    resolve(JSON.parse(msg.content.toString()) as T);
                }
            },
            { noAck: true }
        );

        ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
            correlationId,
            replyTo: replyQueue,
            persistent: true,
        });
    });
}

export async function publishEvent(
    exchange: string,
    routingKey: string,
    payload: unknown
): Promise<void> {
    const ch = await getChannel();
    await ch.assertExchange(exchange, "topic", { durable: true });
    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
    });
}

export async function subscribeEvents(
    exchange: string,
    routingKey: string,
    handler: (payload: unknown) => Promise<void>
): Promise<void> {
    const ch = await getChannel();
    await ch.assertExchange(exchange, "topic", { durable: true });
    const { queue } = await ch.assertQueue("", { exclusive: true });
    await ch.bindQueue(queue, exchange, routingKey);

    ch.consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) {
            return;
        }

        try {
            const payload = JSON.parse(msg.content.toString());
            await handler(payload);
            ch.ack(msg);
        } catch {
            ch.nack(msg, false, false);
        }
    });
}
