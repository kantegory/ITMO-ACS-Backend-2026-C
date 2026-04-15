import { ReviewsRepository } from "../repositories/reviews.repository";

export class ReviewsService {
  constructor(
    private readonly repository: ReviewsRepository,
    private readonly publish: (topic: string, payload: object) => Promise<void>
  ) {}

  async create(payload: { userId: string; restaurantId: string; rating: number; text?: string }) {
    const review = await this.repository.save(payload);
    await this.publish("reviews.review.created", review);
    return { data: review };
  }

  async update(id: string, payload: { rating?: number; text?: string }) {
    const review = await this.repository.update(id, payload);
    if (!review) return { error: [404, { code: "NOT_FOUND", message: "Отзыв не найден" }] as const };
    await this.publish("reviews.review.updated", review);
    return { data: review };
  }

  async remove(id: string) {
    const review = await this.repository.findById(id);
    if (!review) return { error: [404, { code: "NOT_FOUND", message: "Отзыв не найден" }] as const };
    await this.repository.deleteById(id);
    await this.publish("reviews.review.deleted", { id, restaurantId: review.restaurantId });
    return { data: { id } };
  }

  async internalGetRestaurantRating(restaurantId: string) {
    const rating = await this.repository.getAverageByRestaurant(restaurantId);
    return { data: { restaurantId, rating } };
  }

  async internalListRestaurantReviews(restaurantId: string) {
    const items = await this.repository.findByRestaurantId(restaurantId);
    return { data: { items } };
  }
}
