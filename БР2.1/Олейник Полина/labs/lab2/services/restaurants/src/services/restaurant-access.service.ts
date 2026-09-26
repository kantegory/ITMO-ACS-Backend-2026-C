import dataSource from '../config/data-source';
import { RestaurantAdmin } from '../models/restaurant-admin.entity';

// Копия лр1/src/services/restaurant-access.service.ts — полностью локальна,
// таблица restaurant_admin целиком в этой БД, кросс-сервисных вызовов не требует.
async function isRestaurantAdmin(
    userId: number,
    restaurantId: number,
): Promise<boolean> {
    const repository = dataSource.getRepository(RestaurantAdmin);
    const record = await repository.findOneBy({
        user_id: userId,
        restaurant_id: restaurantId,
    });

    return record !== null;
}

export { isRestaurantAdmin };
