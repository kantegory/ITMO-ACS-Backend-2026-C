import { EntityManager } from 'typeorm';

import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';

// Пересчитывает Restaurant.rating как среднее по всем отзывам этого ресторана.
// Принимает необязательный manager — если функцию вызывают ВНУТРИ транзакции
// (dataSource.transaction(async (manager) => {...})), нужно передать именно этот manager,
// чтобы обновление рейтинга попало в ту же транзакцию, что и создание/изменение/удаление
// отзыва. Если manager не передали — используется обычный dataSource.manager
// (для случаев, когда вызов не внутри транзакции).
async function recalculateRating(
    restaurantId: number,
    manager: EntityManager = dataSource.manager,
): Promise<void> {
    // SQL AVG() сам считает среднее по всем строкам, где restaurant_id совпадает
    const result = await manager
        .getRepository(Review)
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'avg')
        .where('review.restaurant_id = :restaurantId', { restaurantId })
        .getRawOne();

    // если отзывов совсем нет, AVG() вернёт null — тогда рейтинг сбрасываем в 0
    const average = result?.avg ? parseFloat(result.avg) : 0;
    const rounded = Math.round(average * 100) / 100; // округляем до двух знаков после запятой

    await manager
        .getRepository(Restaurant)
        .update({ id: restaurantId }, { rating: rounded });
}

export { recalculateRating };
