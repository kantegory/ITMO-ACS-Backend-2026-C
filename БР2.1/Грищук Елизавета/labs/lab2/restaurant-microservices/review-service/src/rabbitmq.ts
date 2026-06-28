import amqp from 'amqplib';

const AMQP_URL = process.env.AMQP_URL || '';
const QUEUE_NAME = 'booking_created';

export const connectRabbitMQ = async (): Promise<void> => {
    try {
        const connection = await amqp.connect(AMQP_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log('review-service: RabbitMQ connected, waiting for messages...');

        channel.consume(QUEUE_NAME, (msg) => {
            if (msg) {
                const content = JSON.parse(msg.content.toString());
                console.log('review-service: Received booking_created event:', content);
                channel.ack(msg);
            }
        });
    } catch (err) {
        console.error('review-service: RabbitMQ connection error:', err);
    }
};