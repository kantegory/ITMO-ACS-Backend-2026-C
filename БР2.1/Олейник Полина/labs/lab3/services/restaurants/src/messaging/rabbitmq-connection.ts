import amqp, { Channel } from 'amqplib';

import SETTINGS from '../config/settings';

// Тот же exchange, что объявляет bookings (durable, direct) — обе стороны
// вызывают assertExchange с одинаковыми параметрами, это идемпотентно.
export const BOOKING_EVENTS_EXCHANGE = 'booking-events';
export const BOOKING_NOTIFICATIONS_QUEUE = 'restaurants.booking-notifications';
export const BOOKING_EVENT_ROUTING_KEYS = ['booking.created', 'booking.status_changed'];

const CONNECT_ATTEMPTS = 5;
const CONNECT_RETRY_DELAY_MS = 2000;

let channel: Channel | null = null;

function buildConnectionUrl(): string {
    return `amqp://${SETTINGS.RABBITMQ_USER}:${SETTINGS.RABBITMQ_PASSWORD}@${SETTINGS.RABBITMQ_HOST}:${SETTINGS.RABBITMQ_PORT}`;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// RabbitMQ может подняться позже сервиса, поэтому подключение при старте
// делается с несколькими попытками, а не один раз.
export async function connectRabbitMQ(): Promise<Channel | null> {
    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
        try {
            const connection = await amqp.connect(buildConnectionUrl());
            const createdChannel = await connection.createChannel();
            await createdChannel.assertExchange(BOOKING_EVENTS_EXCHANGE, 'direct', {
                durable: true,
            });
            await createdChannel.assertQueue(BOOKING_NOTIFICATIONS_QUEUE, { durable: true });
            for (const routingKey of BOOKING_EVENT_ROUTING_KEYS) {
                await createdChannel.bindQueue(
                    BOOKING_NOTIFICATIONS_QUEUE,
                    BOOKING_EVENTS_EXCHANGE,
                    routingKey,
                );
            }

            channel = createdChannel;

            connection.on('error', (error) => {
                console.error('RabbitMQ: ошибка соединения:', error);
                channel = null;
            });
            connection.on('close', () => {
                console.error('RabbitMQ: соединение закрыто');
                channel = null;
            });

            console.log(
                `RabbitMQ: подключение установлено, очередь "${BOOKING_NOTIFICATIONS_QUEUE}" привязана к ключам [${BOOKING_EVENT_ROUTING_KEYS.join(', ')}]`,
            );
            return channel;
        } catch (error) {
            console.error(
                `RabbitMQ: попытка подключения ${attempt}/${CONNECT_ATTEMPTS} не удалась:`,
                error instanceof Error ? error.message : error,
            );
            if (attempt < CONNECT_ATTEMPTS) {
                await delay(CONNECT_RETRY_DELAY_MS);
            }
        }
    }

    console.error(
        'RabbitMQ: не удалось подключиться после нескольких попыток — уведомления о брони не будут обрабатываться до перезапуска сервиса',
    );
    return null;
}

export function getChannel(): Channel | null {
    return channel;
}
