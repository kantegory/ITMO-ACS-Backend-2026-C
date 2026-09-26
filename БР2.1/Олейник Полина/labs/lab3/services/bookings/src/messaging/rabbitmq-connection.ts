import amqp, { Channel } from 'amqplib';

import SETTINGS from '../config/settings';

// Обмен, в который bookings публикует события брони (ДЗ5).
// restaurants сам объявляет очередь и привязку — здесь только exchange,
// т.к. паблишер не обязан знать о существовании подписчиков.
export const BOOKING_EVENTS_EXCHANGE = 'booking-events';

const CONNECT_ATTEMPTS = 5;
const CONNECT_RETRY_DELAY_MS = 2000;

let channel: Channel | null = null;

function buildConnectionUrl(): string {
    return `amqp://${SETTINGS.RABBITMQ_USER}:${SETTINGS.RABBITMQ_PASSWORD}@${SETTINGS.RABBITMQ_HOST}:${SETTINGS.RABBITMQ_PORT}`;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// RabbitMQ может подняться позже сервиса (например, при docker compose up),
// поэтому подключение при старте делается с несколькими попытками, а не один раз.
export async function connectRabbitMQ(): Promise<void> {
    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
        try {
            const connection = await amqp.connect(buildConnectionUrl());
            const createdChannel = await connection.createChannel();
            await createdChannel.assertExchange(BOOKING_EVENTS_EXCHANGE, 'direct', {
                durable: true,
            });

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
                `RabbitMQ: подключение установлено, exchange "${BOOKING_EVENTS_EXCHANGE}" готов`,
            );
            return;
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
        'RabbitMQ: не удалось подключиться после нескольких попыток — публикация событий брони будет недоступна до перезапуска сервиса',
    );
}

export function getChannel(): Channel | null {
    return channel;
}
