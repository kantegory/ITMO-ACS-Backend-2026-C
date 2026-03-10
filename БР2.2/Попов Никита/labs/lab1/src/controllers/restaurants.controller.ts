import 'reflect-metadata';
import {
    Get,
    Post,
    Param,
    QueryParams,
    Body,
    UseBefore,
    Req,
    JsonController,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import dataSource from '../config/data-source';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { Restaurant, PriceLevel } from '../models/restaurant.entity';
import { UserRole } from '../models/user.entity';
import { Booking } from '../models/booking.entity';
import BaseController from '../common/base-controller';
import { ApiErrorDto } from '../common/api-errors';

class PaginationQuery {
    @IsInt()
    @Type(() => Number)
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @IsInt()
    @Type(() => Number)
    @Min(1)
    @IsOptional()
    pageSize?: number = 20;
}

class ListRestaurantsQuery extends PaginationQuery {
    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    cuisineId?: string;

    @IsEnum(PriceLevel)
    @IsOptional()
    priceLevel?: PriceLevel;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    sortBy?: 'priceLevel' | 'rating' | 'name' | 'createdAt';

    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC';
}

class PaginatedRestaurantsDto {
    @Type(() => Restaurant)
    items: Restaurant[];

    total: number;
    page: number;
    pageSize: number;
}

class ListRestaurantsResponseDto {
    data: PaginatedRestaurantsDto;
}

class TimeSlotDto {
    from: string;
    to: string;
}

class AvailableSlotsResponseDto {
    slots: TimeSlotDto[];
}

class GetAvailableSlotsQuery {
    @IsDateString()
    date: string;

    @IsInt()
    @Type(() => Number)
    @Min(1)
    guestCount: number;

    @IsInt()
    @Type(() => Number)
    @Min(15)
    @IsOptional()
    durationMinutes?: number = 60;
}

class RestaurantResponseDto {
    @Type(() => Restaurant)
    data: Restaurant;
}

class CreateRestaurantDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsEnum(PriceLevel)
    priceLevel: PriceLevel;

    @IsInt()
    @Type(() => Number)
    capacity: number;
}

@JsonController("/restaurants")
export class RestaurantsController extends BaseController {
    private restaurantRepo = dataSource.getRepository(Restaurant);

    @Get()
    @OpenAPI({ summary: 'Получение списка ресторанов' })
    @ResponseSchema(ListRestaurantsResponseDto, { statusCode: 200 })
    async list(
        @QueryParams({ type: ListRestaurantsQuery })
        query: ListRestaurantsQuery,
    ): Promise<ListRestaurantsResponseDto> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;

        const qb = this.restaurantRepo.createQueryBuilder('restaurant');

        if (query.city) {
            qb.andWhere('restaurant.city ILIKE :city', {
                city: `%${query.city}%`,
            });
        }

        if (query.priceLevel) {
            qb.andWhere('restaurant.priceLevel = :priceLevel', {
                priceLevel: query.priceLevel,
            });
        }

        if (query.name) {
            qb.andWhere('restaurant.name ILIKE :name', {
                name: `%${query.name}%`,
            });
        }

        if (query.sortBy) {
            qb.orderBy(
                `restaurant.${query.sortBy}`,
                (query.sortOrder || 'ASC') as 'ASC' | 'DESC',
            );
        }

        qb.skip((page - 1) * pageSize).take(pageSize);

        const [items, total] = await qb.getManyAndCount();

        return {
            data: {
                items,
                total,
                page,
                pageSize,
            },
        };
    }

    @Post()
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создание ресторана',
        description: 'Создание ресторана, доступно только для администратора и владельца', })
    @ResponseSchema(RestaurantResponseDto, {
        statusCode: 200,
        description: 'Ресторан успешно создан',
    })
    async create(
        @Body({ type: CreateRestaurantDto }) body: CreateRestaurantDto,
        @Req() request: RequestWithUser,
    ): Promise<RestaurantResponseDto> {
        const { user } = request;
        if (![UserRole.ADMIN, UserRole.OWNER].includes(user.role)) {
            throw new Error('Forbidden');
        }

        const restaurant: Restaurant = this.restaurantRepo.create(
            body as Partial<Restaurant>,
        );
        const saved: Restaurant = await this.restaurantRepo.save(restaurant);

        return { data: saved };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Получение ресторана по id' })
    @ResponseSchema(RestaurantResponseDto, { statusCode: 200 })
    @ResponseSchema(ApiErrorDto, { statusCode: 404 })
    async getById(
        @Param('id') id: string,
    ): Promise<RestaurantResponseDto | ApiErrorDto> {
        const restaurant = await this.restaurantRepo.findOneBy({ id });
        if (!restaurant) {
            return { code: 'NOT_FOUND', message: 'Ресторан не найден' };
        }

        return { data: restaurant };
    }

    @Get('/restaurants/:restaurantId/available-slots')
    @OpenAPI({ summary: 'Получение доступных слотов бронирования' })
    @ResponseSchema(AvailableSlotsResponseDto, { statusCode: 200 })
    @ResponseSchema(ApiErrorDto, { statusCode: 400 })
    @ResponseSchema(ApiErrorDto, { statusCode: 404 })
    async getAvailableSlots(
        @Param('restaurantId') restaurantId: string,
        @QueryParams({ type: GetAvailableSlotsQuery })
        query: GetAvailableSlotsQuery,
    ): Promise<AvailableSlotsResponseDto | ApiErrorDto> {
        const restaurant = await this.restaurantRepo.findOneBy({
            id: restaurantId,
        });
        if (!restaurant) {
            return {
                code: 'NOT_FOUND',
                message: 'Ресторан не найден',
                details: restaurantId,
            };
        }

        if (query.guestCount > restaurant.capacity) {
            return {
                code: 'BAD_REQUEST',
                message: 'Максимальное количество гостей превышено',
            };
        }

        const durationMs =
            (query.durationMinutes ?? 60) * 60 * 1000;
        const date = new Date(query.date);
        const dayStart = new Date(date);
        dayStart.setHours(10, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 0, 0, 0);

        const bookings = await dataSource
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .where('booking.restaurantId = :restaurantId', { restaurantId })
            .andWhere('booking.status != :cancelled', {
                cancelled: 'CANCELLED',
            })
            .andWhere('booking.fromDate < :dayEnd', { dayEnd })
            .andWhere('booking.toDate > :dayStart', { dayStart })
            .getMany();

        const slots: TimeSlotDto[] = [];
        let slotStart = new Date(dayStart);

        while (slotStart.getTime() + durationMs <= dayEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + durationMs);
            const overlaps = bookings.some(
                (b) =>
                    new Date(b.fromDate) < slotEnd &&
                    new Date(b.toDate) > slotStart,
            );
            if (!overlaps) {
                slots.push({
                    from: slotStart.toISOString(),
                    to: slotEnd.toISOString(),
                });
            }
            slotStart = slotEnd;
        }

        return { slots };
    }
}

