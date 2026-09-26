import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    QueryParams,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Restaurant } from '../models/restaurant.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { TimeSlot } from '../models/time-slot.entity';
import { City } from '../models/city.entity';
import { Cuisine } from '../models/cuisine.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    RestaurantSearchDto,
    RestaurantCreateDto,
    RestaurantUpdateDto,
    RestaurantResponseDto,
    RestaurantDetailsDto,
    RestaurantPageDto,
    toRestaurantResponseDto,
    toRestaurantDetailsDto,
} from '../dto/restaurant.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation } from '../utils/db-errors';
import { getSkipTake, buildPageMeta } from '../utils/pagination';
import { bookingsExist } from '../clients/bookings-client';

// Адаптация лр1/src/controllers/restaurant.controller.ts: при удалении сначала
// проверяются брони на все столики/слоты ресторана через эндпоинт 7 (раздел 9
// CLAUDE.md), затем — как и раньше — локальный FK на отзывы (RESTRICT внутри
// restaurants_db, эта связь никуда не делась).
const SORT_OPTIONS: Record<string, [string, 'ASC' | 'DESC']> = {
    rating_desc: ['restaurant.rating', 'DESC'],
    price_asc: ['restaurant.average_check', 'ASC'],
    price_desc: ['restaurant.average_check', 'DESC'],
    name_asc: ['restaurant.name', 'ASC'],
};

@EntityController({
    baseRoute: '/restaurants',
    entity: Restaurant,
})
class RestaurantController extends BaseController {
    // GET /restaurants — публичный поиск с фильтрами, сортировкой и пагинацией
    @Get('')
    async list(
        @QueryParams({ type: RestaurantSearchDto }) query: RestaurantSearchDto,
    ): Promise<RestaurantPageDto> {
        const qb = this.repository
            .createQueryBuilder('restaurant')
            .where('restaurant.is_active = :isActive', { isActive: true });

        if (query.q) {
            qb.andWhere('restaurant.name ILIKE :q', { q: `%${query.q}%` });
        }
        if (query.city_id !== undefined) {
            qb.andWhere('restaurant.city_id = :cityId', {
                cityId: query.city_id,
            });
        }
        if (query.district) {
            qb.andWhere('restaurant.district ILIKE :district', {
                district: `%${query.district}%`,
            });
        }
        if (query.cuisine_id !== undefined) {
            qb.andWhere('restaurant.cuisine_id = :cuisineId', {
                cuisineId: query.cuisine_id,
            });
        }
        if (query.min_price !== undefined) {
            qb.andWhere('restaurant.average_check >= :minPrice', {
                minPrice: query.min_price,
            });
        }
        if (query.max_price !== undefined) {
            qb.andWhere('restaurant.average_check <= :maxPrice', {
                maxPrice: query.max_price,
            });
        }
        if (query.min_rating !== undefined) {
            qb.andWhere('restaurant.rating >= :minRating', {
                minRating: query.min_rating,
            });
        }

        const [sortColumn, sortDirection] =
            SORT_OPTIONS[query.sort || 'rating_desc'];
        qb.orderBy(sortColumn, sortDirection);

        const { skip, take } = getSkipTake(query.page, query.limit);
        qb.skip(skip).take(take);

        const [items, total] = await qb.getManyAndCount();

        return {
            items: items.map(toRestaurantResponseDto),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }

    // POST /restaurants — только ADMIN
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async create(
        @Body({ type: RestaurantCreateDto }) data: RestaurantCreateDto,
    ): Promise<RestaurantResponseDto> {
        const cityRepository = dataSource.getRepository(City);
        const cuisineRepository = dataSource.getRepository(Cuisine);

        const city = await cityRepository.findOneBy({ id: data.city_id });
        if (!city) {
            throw new NotFoundError('City not found');
        }

        const cuisine = await cuisineRepository.findOneBy({
            id: data.cuisine_id,
        });
        if (!cuisine) {
            throw new NotFoundError('Cuisine not found');
        }

        const restaurant = this.repository.create(data);
        await this.repository.save(restaurant);

        return toRestaurantResponseDto(restaurant as Restaurant);
    }

    // GET /restaurants/{restaurantId} — публичная страница ресторана
    @Get('/:restaurantId')
    async getOne(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantDetailsDto> {
        const restaurant = await this.repository.findOne({
            where: { id: restaurantId },
            relations: ['city', 'cuisine'],
        });

        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const photoRepository = dataSource.getRepository(RestaurantPhoto);
        const photos = await photoRepository.find({
            where: { restaurant_id: restaurantId },
            order: { sort_order: 'ASC' },
        });

        return toRestaurantDetailsDto(restaurant as Restaurant, photos);
    }

    // PATCH /restaurants/{restaurantId} — ADMIN или администратор именно этого ресторана
    @Patch('/:restaurantId')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async update(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: RestaurantUpdateDto }) data: RestaurantUpdateDto,
    ): Promise<RestaurantResponseDto> {
        const restaurant = await this.repository.findOneBy({
            id: restaurantId,
        });

        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        if (data.city_id !== undefined) {
            const city = await dataSource
                .getRepository(City)
                .findOneBy({ id: data.city_id });
            if (!city) {
                throw new NotFoundError('City not found');
            }
        }

        if (data.cuisine_id !== undefined) {
            const cuisine = await dataSource
                .getRepository(Cuisine)
                .findOneBy({ id: data.cuisine_id });
            if (!cuisine) {
                throw new NotFoundError('Cuisine not found');
            }
        }

        Object.assign(restaurant as Restaurant, data);
        await this.repository.save(restaurant as Restaurant);

        return toRestaurantResponseDto(restaurant as Restaurant);
    }

    // DELETE /restaurants/{restaurantId} — только ADMIN
    @Delete('/:restaurantId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async remove(@Param('restaurantId') restaurantId: number): Promise<void> {
        const restaurant = await this.repository.findOneBy({
            id: restaurantId,
        });

        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const tableIds = (
            await dataSource.getRepository(RestaurantTable).find({
                where: { restaurant_id: Number(restaurantId) },
                select: ['id'],
            })
        ).map((table) => table.id);
        const timeSlotIds = (
            await dataSource.getRepository(TimeSlot).find({
                where: { restaurant_id: Number(restaurantId) },
                select: ['id'],
            })
        ).map((slot) => slot.id);

        if (tableIds.length > 0 || timeSlotIds.length > 0) {
            const { exists } = await bookingsExist({ tableIds, timeSlotIds });
            if (exists) {
                throw new ConflictError(
                    'Restaurant has bookings, hide it instead (is_active = false)',
                );
            }
        }

        try {
            await this.repository.remove(restaurant);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new ConflictError(
                    'Restaurant has reviews, hide it instead (is_active = false)',
                );
            }

            throw error;
        }
    }
}

export default RestaurantController;
