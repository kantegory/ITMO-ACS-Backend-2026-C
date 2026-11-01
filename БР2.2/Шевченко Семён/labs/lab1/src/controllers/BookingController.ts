import { Request, Response } from "express";
import { db } from "../database";
import { Booking } from "../entities/Booking";
import { bookingOptions, loadCatalog } from "../catalog";
import { ApiError, choice, date, positiveInteger, text, uuid } from "../validation";

const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

function historyQuery(req: Request) {
  const from = date(req.query.date_from, "date_from", false);
  const to = date(req.query.date_to, "date_to", false);
  if (from && to && from > to) throw new ApiError(400, "Начало периода позже окончания");
  const sort = choice(req.query.sort, ["date_asc", "date_desc"], "date_desc");
  const query = db.getRepository(Booking).createQueryBuilder("b");
  if (from) query.andWhere("b.booking_date >= :from", { from });
  if (to) query.andWhere("b.booking_date <= :to", { to });
  if (req.query.status !== undefined) query.andWhere("b.status = :status", { status: choice(req.query.status, statuses, "CONFIRMED") });
  return query.orderBy("b.booking_date", sort === "date_asc" ? "ASC" : "DESC").addOrderBy("b.created_at", "DESC").addOrderBy("b.id", "ASC");
}

function futureDate(value: unknown) {
  const result = date(value, "booking_date")!;
  if (result < new Date().toISOString().slice(0, 10)) throw new ApiError(400, "Нельзя выбрать прошедшую дату");
  return result;
}

export class BookingController {
  static async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const table_id = uuid(body.table_id, "table_id")!;
    const time_slot_id = uuid(body.time_slot_id, "time_slot_id")!;
    const booking_date = futureDate(body.booking_date);
    if (typeof body.guests_count !== "number") throw new ApiError(400, "Число гостей должно быть числом");
    const guests_count = positiveInteger(body.guests_count, "guests_count");
    if (body.comment != null && (typeof body.comment !== "string" || body.comment.length > 1000)) throw new ApiError(400, "Комментарий должен быть строкой до 1000 символов");
    const options = await bookingOptions(table_id, time_slot_id);
    if (!options.is_active || guests_count > options.seats) throw new ApiError(400, "Недостаточно мест или столик недоступен");
    const repo = db.getRepository(Booking);
    const booking = repo.create({ table_id, time_slot_id, booking_date, guests_count, comment: body.comment,
      user_id: res.locals.user.id, status: "CONFIRMED", created_at: new Date() });
    await repo.save(booking);
    res.status(201).json(booking);
  }

  static async mine(req: Request, res: Response) {
    const restaurant_id = uuid(req.query.restaurant_id, "restaurant_id", false);
    const name = text(req.query.restaurant_name, "restaurant_name");
    const query = historyQuery(req).andWhere("b.user_id = :user_id", { user_id: res.locals.user.id });
    if (restaurant_id || name) {
      const restaurants = await loadCatalog({ restaurant_id, name });
      const ids = restaurants.flatMap(r => r.tables.map(t => t.id));
      if (!ids.length) return res.json([]);
      query.andWhere("b.table_id IN (:...ids)", { ids });
    }
    res.json(await query.getMany());
  }

  static async availability(req: Request, res: Response) {
    const restaurant_id = uuid(req.query.restaurant_id, "restaurant_id")!;
    const booking_date = futureDate(req.query.booking_date);
    const guests = positiveInteger(req.query.guests_count, "guests_count");
    const [restaurant] = await loadCatalog({ restaurant_id });
    if (!restaurant) throw new ApiError(404, "Ресторан не найден");
    const tables = restaurant.tables.filter(t => t.is_active && t.seats >= guests);
    if (!tables.length) return res.json([]);
    const occupied = await db.getRepository(Booking).createQueryBuilder("b")
      .where("b.table_id IN (:...ids)", { ids: tables.map(t => t.id) })
      .andWhere("b.booking_date = :booking_date", { booking_date })
      .andWhere("b.status IN (:...statuses)", { statuses: ["PENDING", "CONFIRMED"] }).getMany();
    const taken = new Set(occupied.map(b => `${b.table_id}:${b.time_slot_id}`));
    res.json(tables.flatMap(table => restaurant.time_slots.filter(slot => !taken.has(`${table.id}:${slot.id}`))
      .map(slot => ({ table_id: table.id, table_number: table.number, seats: table.seats,
        time_slot_id: slot.id, start_time: slot.start_time, end_time: slot.end_time }))));
  }

  static async forRestaurant(req: Request, res: Response) {
    const restaurant_id = uuid(req.query.restaurant_id, "restaurant_id")!;
    const query = historyQuery(req);
    const [restaurant] = await loadCatalog({ restaurant_id });
    if (!restaurant) throw new ApiError(404, "Ресторан не найден");
    if (restaurant.admin_id !== res.locals.user.id) throw new ApiError(403, "Доступно только администратору этого ресторана");
    const ids = restaurant.tables.map(t => t.id);
    if (!ids.length) return res.json([]);
    res.json(await query.andWhere("b.table_id IN (:...ids)", { ids }).getMany());
  }

  static async changeStatus(req: Request, res: Response) {
    const id = uuid(req.params.id, "id")!;
    const status = choice(req.body?.status, ["CONFIRMED", "CANCELLED", "COMPLETED"], "");
    if (!status) throw new ApiError(400, "Укажите новый статус");
    const repo = db.getRepository(Booking);
    const booking = await repo.findOneBy({ id });
    if (!booking) throw new ApiError(404, "Бронирование не найдено");
    const options = await bookingOptions(booking.table_id, booking.time_slot_id);
    if (options.admin_id !== res.locals.user.id) throw new ApiError(403, "Доступно только администратору этого ресторана");
    if (booking.status === status) return res.json(booking);
    const allowed: Record<string, string[]> = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["CANCELLED", "COMPLETED"] };
    if (!allowed[booking.status]?.includes(status)) throw new ApiError(409, "Недопустимый переход статуса");
    const result = await repo.update({ id, status: booking.status }, { status });
    if (!result.affected) throw new ApiError(409, "Статус уже изменён другим запросом");
    res.json(await repo.findOneByOrFail({ id }));
  }

  static async cancel(req: Request, res: Response) {
    const repo = db.getRepository(Booking);
    const booking = await repo.findOneBy({ id: uuid(req.params.id, "id")!, user_id: res.locals.user.id });
    if (!booking) throw new ApiError(404, "Бронирование не найдено");
    if (booking.status === "COMPLETED") throw new ApiError(409, "Завершённую бронь нельзя отменить");
    if (booking.status !== "CANCELLED") {
      const result = await repo.update({ id: booking.id, status: booking.status }, { status: "CANCELLED" });
      if (!result.affected) throw new ApiError(409, "Статус уже изменён другим запросом");
    }
    res.json(await repo.findOneByOrFail({ id: booking.id }));
  }
}
