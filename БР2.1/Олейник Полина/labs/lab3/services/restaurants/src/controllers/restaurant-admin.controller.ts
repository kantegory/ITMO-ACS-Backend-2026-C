import {
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { Restaurant } from '../models/restaurant.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    RestaurantAdminCreateDto,
    RestaurantAdminDto,
    toRestaurantAdminDto,
} from '../dto/restaurant-admin.dto';
import { ConflictError } from '../errors/http-errors';
import { getUserInternal, updateUserRole, getUsersShort } from '../clients/auth-client';

// Адаптация лр1/src/controllers/restaurant-admin.controller.ts: данные пользователя
// (существование, роль) больше не берутся из локальной БД — только через auth-client
// (сценарий 6, раздел 10 CLAUDE.md). Сбой auth здесь НЕ деградирует до user:null
// (в отличие от отзывов) — действует общее правило раздела 7 (503/504/500).
@EntityController({
    baseRoute: '/restaurants/:restaurantId/admins',
    entity: RestaurantAdmin,
})
class RestaurantAdminController extends BaseController {
    // GET /restaurants/{restaurantId}/admins — сам ADMIN или админ именно этого ресторана
    @Get('')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantAdminDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const records = (await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
        })) as RestaurantAdmin[];

        const users = await getUsersShort(records.map((record) => record.user_id));
        const usersById = new Map(users.map((user) => [user.id, user]));

        return records.map((record) =>
            toRestaurantAdminDto(record, usersById.get(record.user_id)!),
        );
    }

    // POST /restaurants/{restaurantId}/admins — только ADMIN
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async create(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: RestaurantAdminCreateDto }) data: RestaurantAdminCreateDto,
    ): Promise<RestaurantAdminDto> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        let user = await getUserInternal(data.user_id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const existing = await this.repository.findOneBy({
            user_id: data.user_id,
            restaurant_id: Number(restaurantId),
        });
        if (existing) {
            throw new ConflictError(
                'User is already an admin of this restaurant',
            );
        }

        // роль меняется первой (сценарий 6, раздел 10 CLAUDE.md), только если пользователь был обычным USER
        if (user.role === Role.USER) {
            const updated = await updateUserRole(data.user_id, Role.RESTAURANT_ADMIN);
            if (updated) {
                user = updated;
            }
        }

        const record = this.repository.create({
            user_id: data.user_id,
            restaurant_id: Number(restaurantId),
        });
        await this.repository.save(record);

        return toRestaurantAdminDto(record as RestaurantAdmin, user);
    }

    // DELETE /restaurants/{restaurantId}/admins/{userId} — только ADMIN, чисто локально
    @Delete('/:userId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async remove(
        @Param('restaurantId') restaurantId: number,
        @Param('userId') userId: number,
    ): Promise<void> {
        const record = await this.repository.findOneBy({
            restaurant_id: Number(restaurantId),
            user_id: Number(userId),
        });

        if (!record) {
            throw new NotFoundError('Restaurant admin record not found');
        }

        await this.repository.remove(record);
        // роль пользователя специально НЕ понижаем обратно до USER — он мог быть
        // назначен администратором ещё где-то ещё
    }
}

export default RestaurantAdminController;
