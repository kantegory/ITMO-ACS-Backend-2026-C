import amqp from "amqplib";

export async function consumeBookings() {
  if (!process.env.RABBITMQ_URL) return;
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue("booking.created", { durable: true });
  await channel.prefetch(1);
  await channel.consume("booking.created", message => {
    if (!message) return;
    console.log("Получено новое бронирование:", message.content.toString());
    channel.ack(message);
  });
}
