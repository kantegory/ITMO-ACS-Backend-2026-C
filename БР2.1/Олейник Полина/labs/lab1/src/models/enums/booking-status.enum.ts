// Статусы брони столика.
// Допустимые переходы между ними проверяются в services/booking.service.ts:
// PENDING (ожидает подтверждения) -> CONFIRMED (подтверждена) или CANCELLED (отменена)
// CONFIRMED -> COMPLETED (гость пришёл) или CANCELLED
// CANCELLED и COMPLETED — конечные статусы, из них никуда перейти нельзя.
enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export { BookingStatus };
