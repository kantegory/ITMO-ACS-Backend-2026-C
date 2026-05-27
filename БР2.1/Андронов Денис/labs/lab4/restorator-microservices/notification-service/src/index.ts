import {
    EXCHANGES,
    ROUTING_KEYS,
    subscribeEvents,
} from "../../shared/rabbitmq";
import { ReservationCreatedEvent } from "../../shared/types";

async function startNotificationConsumer(): Promise<void> {
    await subscribeEvents(
        EXCHANGES.RESERVATION,
        ROUTING_KEYS.RESERVATION_CREATED,
        async (payload) => {
            const event = payload as ReservationCreatedEvent;
            console.log(
                `[Notification] New reservation #${event.reservationId}: ` +
                    `user ${event.userId} booked restaurant ${event.restaurantId} on ${event.date}`
            );
        }
    );

    console.log("Notification RabbitMQ consumer started");
}

startNotificationConsumer().catch(console.error);
