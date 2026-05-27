import axios from "axios";
import { config } from "../config";
import { BookingsRepository } from "../repositories/bookings.repository";

export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository,
    private readonly publish: (topic: string, payload: object) => Promise<void>
  ) {}

  async create(payload: {
    userId: string;
    restaurantId: string;
    fromDate: string;
    toDate: string;
    guestCount: number;
  }) {
    try {
      await axios.get(`${config.userServiceUrl}/internal/v1/users/${payload.userId}`, {
        headers: { "X-Internal-Api-Key": config.internalApiKey }
      });
      await axios.get(`${config.restaurantServiceUrl}/internal/v1/restaurants/${payload.restaurantId}`, {
        headers: { "X-Internal-Api-Key": config.internalApiKey }
      });
    } catch {
      return { error: [404, { code: "NOT_FOUND", message: "Пользователь или ресторан не найден" }] as const };
    }

    const booking = await this.repository.save({
      ...payload,
      fromDate: new Date(payload.fromDate),
      toDate: new Date(payload.toDate),
      status: "CONFIRMED"
    });
    await this.publish("bookings.booking.created", booking);
    return { data: booking };
  }

  async updateStatus(bookingId: string, status: string) {
    const booking = await this.repository.updateStatus(bookingId, status);
    if (!booking) return { error: [404, { code: "NOT_FOUND", message: "Бронирование не найдено" }] as const };
    await this.publish("bookings.booking.status_changed", { bookingId: booking.id, status: booking.status });
    return { data: booking };
  }

  async getRestaurantBookings(restaurantId: string, from?: string, to?: string, statusNot?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if (fromDate && toDate && fromDate >= toDate) {
      return { error: [400, { code: "BAD_REQUEST", message: "Параметр from должен быть меньше to" }] as const };
    }
    const items = await this.repository.findRestaurantBookings(restaurantId, fromDate, toDate, statusNot);
    return { data: { items, total: items.length } };
  }
}
