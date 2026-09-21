import dataSource from '../config/data-source';
import { RestaurantAdmin } from '../models/restaurant-admin.entity';

// Проверяет: является ли пользователь userId администратором именно ресторана restaurantId
// (то есть есть ли для этой пары запись в таблице RestaurantAdmin).
// Используется и в middlewares/restaurant-admin.middleware.ts, и напрямую в booking.controller.ts
// (там нельзя использовать готовый middleware — нужного restaurantId ещё не знаем, пока
// не найдём саму бронь в базе).
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
