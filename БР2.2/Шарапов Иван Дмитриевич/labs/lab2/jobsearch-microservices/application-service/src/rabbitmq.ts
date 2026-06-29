import amqp, { Channel, Connection } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
export const QUEUE = "application.created";

let channel: Channel | null = null;

export async function connectRabbit(retries = 10): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn: Connection = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log("✅ RabbitMQ подключён (application-service)");
      return;
    } catch (e) {
      console.log(`RabbitMQ недоступен, попытка ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("Не удалось подключиться к RabbitMQ");
}

export function publishApplicationCreated(payload: Record<string, unknown>): void {
  if (!channel) {
    console.warn("RabbitMQ channel не готов, сообщение пропущено");
    return;
  }
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
  console.log("📤 Событие отправлено в очередь:", payload);
}
