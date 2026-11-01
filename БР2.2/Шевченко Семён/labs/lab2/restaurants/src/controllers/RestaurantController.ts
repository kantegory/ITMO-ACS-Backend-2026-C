import { Request, Response } from "express";
import { db } from "../database";
import { Restaurant } from "../entities/Restaurant";
import { City } from "../entities/City";
import { Cuisine } from "../entities/Cuisine";
import { RestaurantTable } from "../entities/RestaurantTable";
import { TimeSlot } from "../entities/TimeSlot";
import { MenuItem } from "../entities/MenuItem";
import { RestaurantPhoto } from "../entities/RestaurantPhoto";
import { Review } from "../entities/Review";
import { ApiError, choice, text, uuid } from "../validation";

export class RestaurantController {
  static async cities(req: Request, res: Response) { res.json(await db.getRepository(City).find()); }
  static async cuisines(req: Request, res: Response) { res.json(await db.getRepository(Cuisine).find()); }

  static async list(req: Request, res: Response) {
    const city_id = uuid(req.query.city_id, "city_id", false);
    const cuisine_id = uuid(req.query.cuisine_id, "cuisine_id", false);
    const name = text(req.query.name, "name");
    const price = text(req.query.max_price, "max_price");
    if (price !== undefined && (!/^\d+$/.test(price) || !Number.isSafeInteger(Number(price)))) throw new ApiError(400, "Средний чек должен быть неотрицательным целым числом");
    const sort = choice(req.query.sort, ["name", "price_asc", "price_desc", "rating_asc", "rating_desc"], "name");
    const query = db.getRepository(Restaurant).createQueryBuilder("r");
    const rating = query.subQuery().select("COALESCE(AVG(review.rating), 0)").from(Review, "review")
      .where("review.restaurant_id = r.id").getQuery();
    query.addSelect(rating, "review_rating");
    if (city_id) query.andWhere("r.city_id = :city_id", { city_id });
    if (cuisine_id) query.innerJoin("restaurant_cuisines", "rc", "rc.restaurant_id = r.id AND rc.cuisine_id = :cuisine_id", { cuisine_id });
    if (price !== undefined) query.andWhere("r.avg_price <= :price", { price: Number(price) });
    if (name) query.andWhere("r.name ILIKE :name", { name: `%${name}%` });
    if (sort.startsWith("price")) query.orderBy("r.avg_price", sort === "price_asc" ? "ASC" : "DESC", "NULLS LAST");
    else if (sort.startsWith("rating")) query.orderBy("review_rating", sort === "rating_asc" ? "ASC" : "DESC");
    else query.orderBy("r.name", "ASC");
    const { entities, raw } = await query.addOrderBy("r.id", "ASC").getRawAndEntities();
    res.json(entities.map((item, index) => ({ ...item, rating: Number(raw[index].review_rating).toFixed(2) })));
  }

  static async detail(req: Request, res: Response) {
    const id = uuid(req.params.id, "id")!;
    const category = text(req.query.menu_category, "menu_category");
    const sort = choice(req.query.reviews_sort, ["newest", "rating_asc", "rating_desc"], "newest");
    const restaurant = await db.getRepository(Restaurant).findOneBy({ id });
    if (!restaurant) throw new ApiError(404, "Ресторан не найден");
    const where = { restaurant_id: id };
    const menu = await db.getRepository(MenuItem).findBy({ ...where, is_available: true, ...(category ? { category } : {}) });
    const tables = await db.getRepository(RestaurantTable).findBy({ ...where, is_active: true });
    const time_slots = await db.getRepository(TimeSlot).find({ where, order: { start_time: "ASC" } });
    const photos = await db.getRepository(RestaurantPhoto).findBy(where);
    const query = db.getRepository(Review).createQueryBuilder("review").where("review.restaurant_id = :id", { id });
    if (sort !== "newest") query.orderBy("review.rating", sort === "rating_asc" ? "ASC" : "DESC");
    const reviews = await query.addOrderBy("review.created_at", "DESC").getMany();
    const average = await db.getRepository(Review).createQueryBuilder("review")
      .select("COALESCE(AVG(review.rating), 0)", "rating").where("review.restaurant_id = :id", { id }).getRawOne();
    res.json({ ...restaurant, rating: Number(average.rating).toFixed(2), menu, tables, time_slots, photos, reviews });
  }
}
