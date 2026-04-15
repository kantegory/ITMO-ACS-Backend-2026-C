import { Repository } from "typeorm";
import { ReviewEntity } from "../entities/review.entity";

export class ReviewsRepository {
  constructor(private readonly repository: Repository<ReviewEntity>) {}

  save(payload: Partial<ReviewEntity>) {
    return this.repository.save(this.repository.create(payload));
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, payload: Partial<ReviewEntity>) {
    const review = await this.findById(id);
    if (!review) return null;
    Object.assign(review, payload);
    return this.repository.save(review);
  }

  deleteById(id: string) {
    return this.repository.delete({ id });
  }

  async getAverageByRestaurant(restaurantId: string) {
    const result = await this.repository
      .createQueryBuilder("r")
      .select("AVG(r.rating)", "avg")
      .where("r.restaurantId = :restaurantId", { restaurantId })
      .getRawOne<{ avg: string | null }>();
    return Number(result?.avg ?? 0);
  }

  findByRestaurantId(restaurantId: string) {
    return this.repository.find({
      where: { restaurantId },
      order: { id: "DESC" }
    });
  }
}
