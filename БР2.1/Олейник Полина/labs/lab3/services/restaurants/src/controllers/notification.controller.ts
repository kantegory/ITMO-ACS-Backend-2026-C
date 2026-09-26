import { Get, Param, UseBefore, NotFoundError } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { NotificationLog } from '../models/notification-log.entity';
import { Restaurant } from '../models/restaurant.entity';

import authMiddleware from '../middlewares/auth.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import { NotificationLogDto, toNotificationLogDto } from '../dto/notification-log.dto';

// Опциональный эндпоинт ДЗ5 ("по желанию") — не описан в docs/openapi.yaml,
// доступ такой же, как у остальных операций администратора ресторана
// (restaurant-admin.controller.ts): сам ADMIN или админ именно этого ресторана.
@EntityController({
    baseRoute: '/restaurants/:restaurantId/notifications',
    entity: NotificationLog,
})
class NotificationController extends BaseController {
    // GET /restaurants/{restaurantId}/notifications
    @Get('')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<NotificationLogDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const records = (await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
            order: { received_at: 'DESC' },
        })) as NotificationLog[];

        return records.map(toNotificationLogDto);
    }
}

export default NotificationController;
