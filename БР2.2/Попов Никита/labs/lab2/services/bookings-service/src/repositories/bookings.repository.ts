import { Repository } from "typeorm";
import { BookingEntity } from "../entities/booking.entity";

export class BookingsRepository {
  constructor(private readonly repository: Repository<BookingEntity>) {}

  save(payload: Partial<BookingEntity>) {
    return this.repository.save(this.repository.create(payload));
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    const booking = await this.findById(id);
    if (!booking) return null;
    booking.status = status;
    return this.repository.save(booking);
  }

  async findRestaurantBookings(restaurantId: string, from?: Date, to?: Date, statusNot?: string) {
    const qb = this.repository.createQueryBuilder("b").where("b.restaurantId = :restaurantId", { restaurantId });
    if (from) qb.andWhere("b.fromDate >= :from", { from });
    if (to) qb.andWhere("b.toDate <= :to", { to });
    if (statusNot) qb.andWhere("b.status != :statusNot", { statusNot });
    return qb.getMany();
  }
}
