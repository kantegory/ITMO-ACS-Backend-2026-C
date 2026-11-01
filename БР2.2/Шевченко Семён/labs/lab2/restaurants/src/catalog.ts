import { In } from "typeorm";
import { db } from "./database";
import { Restaurant } from "./entities/Restaurant";
import { RestaurantTable } from "./entities/RestaurantTable";
import { TimeSlot } from "./entities/TimeSlot";
import { ApiError } from "./validation";

export async function loadCatalog(filters: { restaurant_id?: string; name?: string }) {
  const query = db.getRepository(Restaurant).createQueryBuilder("r");
  if (filters.restaurant_id) query.andWhere("r.id = :id", { id: filters.restaurant_id });
  if (filters.name) query.andWhere("r.name ILIKE :name", { name: `%${filters.name}%` });
  const restaurants = await query.getMany();
  if (!restaurants.length) return [];
  const ids = restaurants.map(r => r.id);
  const tables = await db.getRepository(RestaurantTable).findBy({ restaurant_id: In(ids) });
  const slots = await db.getRepository(TimeSlot).find({ where: { restaurant_id: In(ids) }, order: { start_time: "ASC" } });
  return restaurants.map(r => ({ id: r.id, admin_id: r.admin_id,
    tables: tables.filter(t => t.restaurant_id === r.id), time_slots: slots.filter(s => s.restaurant_id === r.id) }));
}

export async function bookingOptions(table_id: string, time_slot_id: string) {
  const table = await db.getRepository(RestaurantTable).findOneBy({ id: table_id });
  const slot = await db.getRepository(TimeSlot).findOneBy({ id: time_slot_id });
  if (!table || !slot) throw new ApiError(404, "Столик или слот не найден");
  if (table.restaurant_id !== slot.restaurant_id) throw new ApiError(400, "Столик и слот относятся к разным ресторанам");
  const restaurant = await db.getRepository(Restaurant).findOneByOrFail({ id: table.restaurant_id });
  return { restaurant_id: restaurant.id, admin_id: restaurant.admin_id, seats: table.seats, is_active: table.is_active };
}
