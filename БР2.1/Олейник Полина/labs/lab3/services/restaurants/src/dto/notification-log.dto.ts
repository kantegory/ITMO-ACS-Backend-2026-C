import { NotificationLog } from '../models/notification-log.entity';

// Опциональный эндпоинт ДЗ5 (по желанию) — только чтение, поэтому только DTO ответа.
class NotificationLogDto {
    id: number;
    event: string;
    booking_id: number;
    restaurant_id: number;
    payload: Record<string, unknown>;
    received_at: Date;
}

function toNotificationLogDto(log: NotificationLog): NotificationLogDto {
    return {
        id: log.id,
        event: log.event,
        booking_id: log.booking_id,
        restaurant_id: log.restaurant_id,
        payload: log.payload,
        received_at: log.received_at,
    };
}

export { NotificationLogDto, toNotificationLogDto };
