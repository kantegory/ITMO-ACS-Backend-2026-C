import { RestaurantsRepository } from "../repositories/restaurants.repository";
import { config } from "../config";

export class RestaurantsService {
  constructor(
    private readonly repository: RestaurantsRepository,
    private readonly publish: (topic: string, payload: object) => Promise<void>
  ) {}

  async createRestaurant(payload: {
    name: string;
    capacity: number;
    priceLevel: string;
    cuisine: string;
    city: string;
    photos?: string[];
  }) {
    const restaurant = await this.repository.saveRestaurant(payload);
    await this.publish("restaurants.restaurant.created", restaurant);
    return { data: restaurant };
  }

  async listRestaurants(query: { page?: string; limit?: string; priceLevel?: string; cuisine?: string; city?: string }) {
    const parsedPage = Number(query.page ?? 1);
    const parsedLimit = Number(query.limit ?? 20);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(Math.floor(parsedLimit), 100) : 20;
    const filters = {
      priceLevel: query.priceLevel,
      cuisine: query.cuisine,
      city: query.city
    };

    const [items, total] = await Promise.all([
      this.repository.findRestaurantsPage(page, limit, filters),
      this.repository.countRestaurants(filters)
    ]);

    return { data: { items, total, page, limit, filters } };
  }

  async getRestaurantById(id: string) {
    const restaurant = await this.repository.findRestaurantById(id);
    if (!restaurant) return { error: [404, { code: "NOT_FOUND", message: "Ресторан не найден" }] as const };

    const [menu, reviews] = await Promise.all([
      this.repository.findMenuItemsByRestaurantId(id),
      this.fetchRestaurantReviews(id)
    ]);

    return { data: { ...restaurant, menu, reviews } };
  }

  async updateRestaurant(
    id: string,
    payload: {
      name?: string;
      capacity?: number;
      priceLevel?: string;
      cuisine?: string;
      city?: string;
      photos?: string[];
    }
  ) {
    const restaurant = await this.repository.updateRestaurant(id, payload);
    if (!restaurant) return { error: [404, { code: "NOT_FOUND", message: "Ресторан не найден" }] as const };
    await this.publish("restaurants.restaurant.updated", restaurant);
    return { data: restaurant };
  }

  async upsertMenuItem(restaurantId: string, payload: { name: string; price: number }) {
    const menuItem = await this.repository.saveMenuItem({ ...payload, restaurantId });
    await this.publish("restaurants.menu_item.changed", { action: "UPSERT", ...menuItem });
    return { data: menuItem };
  }

  async deleteMenuItem(restaurantId: string, id: string) {
    await this.repository.deleteMenuItem(id, restaurantId);
    await this.publish("restaurants.menu_item.changed", { action: "DELETE", id, restaurantId });
    return { data: { id } };
  }

  async internalGetRestaurant(restaurantId: string) {
    const restaurant = await this.repository.findRestaurantById(restaurantId);
    if (!restaurant) return { error: [404, { code: "NOT_FOUND", message: "Ресторан не найден" }] as const };
    return { data: restaurant };
  }

  async updateRating(restaurantId: string, rating: number) {
    const restaurant = await this.repository.updateRating(restaurantId, rating);
    if (!restaurant) return { error: [404, { code: "NOT_FOUND", message: "Ресторан не найден" }] as const };
    await this.publish("restaurants.restaurant.rating_recalculated", { restaurantId: restaurant.id, rating: restaurant.rating });
    return { data: { restaurantId: restaurant.id, rating: restaurant.rating } };
  }

  async recalculateRatingFromReviews(restaurantId: string) {
    const response = await fetch(`${config.reviewsServiceUrl}/internal/v1/restaurants/${restaurantId}/rating`, {
      headers: { "X-Internal-Api-Key": config.internalApiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rating from reviews-service: ${response.status}`);
    }

    const body = (await response.json()) as { data?: { rating?: number } };
    const rating = Number(body.data?.rating ?? 0);

    if (!Number.isFinite(rating)) {
      throw new Error("Invalid rating received from reviews-service");
    }

    await this.updateRating(restaurantId, rating);
  }

  private async fetchRestaurantReviews(restaurantId: string) {
    const response = await fetch(`${config.reviewsServiceUrl}/internal/v1/restaurants/${restaurantId}/reviews`, {
      headers: { "X-Internal-Api-Key": config.internalApiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews from reviews-service: ${response.status}`);
    }

    const body = (await response.json()) as { data?: { items?: unknown[] } };
    return body.data?.items ?? [];
  }
}
