import amqp from "amqplib";

export async function publishBooking(data: { booking_id: string; restaurant_id: string; guests_count: number }) {
  if (!process.env.RABBITMQ_URL) return;
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createConfirmChannel();
  try {
    await channel.assertQueue("booking.created", { durable: true });
    channel.sendToQueue("booking.created", Buffer.from(JSON.stringify(data)), { persistent: true });
    await channel.waitForConfirms();
  } finally {
    await connection.close();
  }
}
