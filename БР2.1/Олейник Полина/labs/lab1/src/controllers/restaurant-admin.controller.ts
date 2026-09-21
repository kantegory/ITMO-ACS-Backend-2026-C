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
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { Restaurant } from '../models/restaurant.entity';
import { User } from '../models/user.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    RestaurantAdminCreateDto,
    RestaurantAdminDto,
    toRestaurantAdminDto,
} from '../dto/restaurant-admin.dto';
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';

// Назначение и снятие администраторов конкретного ресторана.
// baseRoute содержит :restaurantId — значит он "вложен" в конкретный ресторан,
// и во всех методах ниже этот id доступен через @Param('restaurantId').
@EntityController({
    baseRoute: '/restaurants/:restaurantId/admins',
    entity: RestaurantAdmin,
})
class RestaurantAdminController extends BaseController {
    // GET /restaurants/{restaurantId}/admins — сам ADMIN или админ именно этого ресторана
    @Get('')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Администраторы ресторана' })
    @ResponseSchema(RestaurantAdminDto, { isArray: true, statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantAdminDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const records = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
            relations: ['user'], // подтягиваем данные пользователя, чтобы показать имя/фамилию в ответе
        });

        return records.map((record) =>
            toRestaurantAdminDto(record as RestaurantAdmin),
        );
    }

    // POST /restaurants/{restaurantId}/admins — только ADMIN может назначать администраторов
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    @OpenAPI({ summary: 'Назначить администратора ресторана' })
    @ResponseSchema(RestaurantAdminDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOneBy({ id: data.user_id });
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

        // если это был обычный USER — автоматически повышаем его до RESTAURANT_ADMIN.
        // Если он уже ADMIN или уже RESTAURANT_ADMIN — роль не трогаем.
        if (user.role === Role.USER) {
            user.role = Role.RESTAURANT_ADMIN;
            await userRepository.save(user);
        }

        const record = this.repository.create({
            user_id: data.user_id,
            restaurant_id: Number(restaurantId),
        });
        await this.repository.save(record);

        // перечитываем запись из базы с подгруженным пользователем — так проще,
        // чем вручную собирать связь из уже имеющихся переменных
        const saved = await this.repository.findOne({
            where: { id: (record as RestaurantAdmin).id },
            relations: ['user'],
        });

        return toRestaurantAdminDto(saved as RestaurantAdmin);
    }

    // DELETE /restaurants/{restaurantId}/admins/{userId} — только ADMIN
    @Delete('/:userId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    @OpenAPI({ summary: 'Снять администратора ресторана' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
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
        // назначен администратором ещё где-то ещё, снимать роль здесь было бы ошибкой
    }
}

export default RestaurantAdminController;
