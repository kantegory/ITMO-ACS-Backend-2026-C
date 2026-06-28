import amqp from 'amqplib';

const AMQP_URL = process.env.AMQP_URL || '';
const QUEUE_NAME = 'booking_created';

let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log('booking-service: RabbitMQ connected');
    } catch (err) {
        console.error('booking-service: RabbitMQ connection error:', err);
    }
};

export const publishBookingCreated = async (booking: object): Promise<void> => {
    if (!channel) {
        console.error('RabbitMQ channel not initialized');
        return;
    }
    const message = JSON.stringify(booking);
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
    console.log('booking-service: Message sent to queue:', message);
};