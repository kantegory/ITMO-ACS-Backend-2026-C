import { EntityManager } from 'typeorm';

import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';

// Копия лр1/src/services/review.service.ts — целиком локальная транзакция
// (review и restaurant в одной БД), кросс-сервисных вызовов не требует.
async function recalculateRating(
    restaurantId: number,
    manager: EntityManager = dataSource.manager,
): Promise<void> {
    const result = await manager
        .getRepository(Review)
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'avg')
        .where('review.restaurant_id = :restaurantId', { restaurantId })
        .getRawOne();

    const average = result?.avg ? parseFloat(result.avg) : 0;
    const rounded = Math.round(average * 100) / 100;

    await manager
        .getRepository(Restaurant)
        .update({ id: restaurantId }, { rating: rounded });
}

export { recalculateRating };
