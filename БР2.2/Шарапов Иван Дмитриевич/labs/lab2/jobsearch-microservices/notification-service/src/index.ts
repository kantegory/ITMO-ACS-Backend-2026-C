import amqp, { Connection, Channel } from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "application.created";

async function connect(retries = 15): Promise<Channel> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn: Connection = await amqp.connect(RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log("✅ RabbitMQ подключён (notification-service)");
      return channel;
    } catch {
      console.log(`RabbitMQ недоступен, попытка ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("Не удалось подключиться к RabbitMQ");
}

async function main() {
  const channel = await connect();
  channel.prefetch(1);
  console.log("👂 Ожидание событий из очереди:", QUEUE);

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      // Здесь могла бы быть отправка email/push. Для учебного проекта — лог.
      console.log(
        `🔔 Уведомление работодателю #${event.employerId}: ` +
          `новый отклик на вакансию «${event.vacancyTitle}» (отклик #${event.applicationId})`
      );
      channel.ack(msg);
    } catch (e) {
      console.error("Ошибка обработки сообщения:", e);
      channel.nack(msg, false, false);
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
