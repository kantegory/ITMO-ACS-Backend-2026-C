import { Repository, SelectQueryBuilder } from "typeorm";
import { MenuItemEntity } from "../entities/menu-item.entity";
import { RestaurantEntity } from "../entities/restaurant.entity";

export class RestaurantsRepository {
  constructor(
    private readonly restaurants: Repository<RestaurantEntity>,
    private readonly menuItems: Repository<MenuItemEntity>
  ) {}

  saveRestaurant(payload: Partial<RestaurantEntity>) {
    return this.restaurants.save(this.restaurants.create(payload));
  }

  findRestaurantById(id: string) {
    return this.restaurants.findOne({ where: { id } });
  }

  private applyFilters(
    qb: SelectQueryBuilder<RestaurantEntity>,
    filters: { priceLevel?: string; cuisine?: string; city?: string }
  ) {
    if (filters.priceLevel) {
      qb.andWhere("r.priceLevel = :priceLevel", { priceLevel: filters.priceLevel });
    }
    if (filters.cuisine) {
      qb.andWhere("r.cuisine = :cuisine", { cuisine: filters.cuisine });
    }
    if (filters.city) {
      qb.andWhere("r.city = :city", { city: filters.city });
    }
    return qb;
  }

  findRestaurantsPage(
    page: number,
    limit: number,
    filters: { priceLevel?: string; cuisine?: string; city?: string }
  ) {
    const qb = this.restaurants.createQueryBuilder("r").orderBy("r.rating", "DESC").addOrderBy("r.name", "ASC");
    this.applyFilters(qb, filters);
    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  countRestaurants(filters: { priceLevel?: string; cuisine?: string; city?: string }) {
    const qb = this.restaurants.createQueryBuilder("r").select("COUNT(*)", "cnt");
    this.applyFilters(qb, filters);
    return qb.getRawOne<{ cnt: string }>().then((row) => Number(row?.cnt ?? 0));
  }

  async updateRestaurant(id: string, payload: Partial<RestaurantEntity>) {
    const restaurant = await this.findRestaurantById(id);
    if (!restaurant) return null;
    Object.assign(restaurant, payload);
    return this.restaurants.save(restaurant);
  }

  saveMenuItem(payload: Partial<MenuItemEntity>) {
    return this.menuItems.save(this.menuItems.create(payload));
  }

  findMenuItemsByRestaurantId(restaurantId: string) {
    return this.menuItems.find({ where: { restaurantId }, order: { name: "ASC" } });
  }

  deleteMenuItem(id: string, restaurantId: string) {
    return this.menuItems.delete({ id, restaurantId });
  }

  async updateRating(restaurantId: string, rating: number) {
    const restaurant = await this.findRestaurantById(restaurantId);
    if (!restaurant) return null;
    restaurant.rating = rating;
    return this.restaurants.save(restaurant);
  }
}
