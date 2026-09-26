import { Booking } from '../models/booking.entity';
import { BOOKING_EVENTS_EXCHANGE, getChannel } from './rabbitmq-connection';

type BookingEventName = 'booking.created' | 'booking.status_changed';

interface BookingEventMessage {
    event: BookingEventName;
    bookingId: number;
    restaurantId: number;
    userId: number;
    status: string;
    occurredAt: string;
}

// Публикация — по принципу "выстрелил и забыл": сбой RabbitMQ (нет канала,
// ошибка publish) не должен мешать созданию брони или ответу клиенту,
// поэтому здесь только console.error, исключение наружу не пробрасывается.
function publish(event: BookingEventName, routingKey: string, message: BookingEventMessage): void {
    const channel = getChannel();

    if (!channel) {
        console.error(
            `RabbitMQ: канал недоступен, событие "${event}" для брони ${message.bookingId} не отправлено`,
        );
        return;
    }

    try {
        channel.publish(
            BOOKING_EVENTS_EXCHANGE,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true, contentType: 'application/json' },
        );
    } catch (error) {
        console.error(`RabbitMQ: не удалось опубликовать событие "${event}":`, error);
    }
}

function publishBookingCreated(booking: Booking): void {
    publish('booking.created', 'booking.created', {
        event: 'booking.created',
        bookingId: booking.id,
        restaurantId: booking.restaurant_id,
        userId: booking.user_id,
        status: booking.status,
        occurredAt: booking.created_at.toISOString(),
    });
}

function publishBookingStatusChanged(booking: Booking): void {
    publish('booking.status_changed', 'booking.status_changed', {
        event: 'booking.status_changed',
        bookingId: booking.id,
        restaurantId: booking.restaurant_id,
        userId: booking.user_id,
        status: booking.status,
        occurredAt: booking.updated_at.toISOString(),
    });
}

export { publishBookingCreated, publishBookingStatusChanged };
