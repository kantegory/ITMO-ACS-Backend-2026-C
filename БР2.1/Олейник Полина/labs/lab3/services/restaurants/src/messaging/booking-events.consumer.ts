import { Channel, ConsumeMessage } from 'amqplib';

import dataSource from '../config/data-source';
import { NotificationLog } from '../models/notification-log.entity';
import { BOOKING_NOTIFICATIONS_QUEUE } from './rabbitmq-connection';

interface BookingEventMessage {
    event: string;
    bookingId: number;
    restaurantId: number;
    [key: string]: unknown;
}

async function handleMessage(channel: Channel, message: ConsumeMessage): Promise<void> {
    try {
        const parsed = JSON.parse(message.content.toString()) as BookingEventMessage;

        const notificationLogRepository = dataSource.getRepository(NotificationLog);
        const notificationLog = notificationLogRepository.create({
            event: parsed.event,
            booking_id: parsed.bookingId,
            restaurant_id: parsed.restaurantId,
            payload: parsed,
        });
        await notificationLogRepository.save(notificationLog);

        channel.ack(message);
    } catch (error) {
        console.error('RabbitMQ: не удалось обработать событие брони:', error);
        // без requeue — считаем сообщение "отравленным" и не пытаемся бесконечно,
        // dead-letter очередь заданием не предусмотрена
        channel.nack(message, false, false);
    }
}

// Слушает всё время жизни процесса (channel.consume не завершается сам).
function startBookingEventsConsumer(channel: Channel): void {
    channel.consume(BOOKING_NOTIFICATIONS_QUEUE, (message) => {
        if (!message) {
            return;
        }

        void handleMessage(channel, message);
    });

    console.log(`RabbitMQ: слушаю очередь "${BOOKING_NOTIFICATIONS_QUEUE}"`);
}

export { startBookingEventsConsumer };
