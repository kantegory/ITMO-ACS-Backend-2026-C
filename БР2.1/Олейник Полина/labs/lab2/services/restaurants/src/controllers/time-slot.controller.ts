import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
    BadRequestError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { TimeSlot } from '../models/time-slot.entity';
import { Restaurant } from '../models/restaurant.entity';

import authMiddleware from '../middlewares/auth.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    TimeSlotCreateDto,
    TimeSlotUpdateDto,
    TimeSlotDto,
    toTimeSlotDto,
} from '../dto/time-slot.dto';
import { ConflictError } from '../errors/http-errors';
import { isUniqueViolation } from '../utils/db-errors';
import { bookingsExist } from '../clients/bookings-client';

// Адаптация лр1/src/controllers/time-slot.controller.ts: ON DELETE RESTRICT на
// бронь заменён вызовом эндпоинта 7 перед удалением (раздел 9 CLAUDE.md),
// см. restaurant-table.controller.ts.
async function hasOverlap(
    repository: BaseController['repository'],
    restaurantId: number,
    startTime: string,
    endTime: string,
    excludeId?: number,
): Promise<boolean> {
    const qb = repository
        .createQueryBuilder('slot')
        .where('slot.restaurant_id = :restaurantId', { restaurantId })
        .andWhere('slot.start_time < :end', { end: endTime })
        .andWhere('slot.end_time > :start', { start: startTime });

    if (excludeId !== undefined) {
        qb.andWhere('slot.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();

    return count > 0;
}

@EntityController({
    baseRoute: '/restaurants/:restaurantId/time-slots',
    entity: TimeSlot,
})
class TimeSlotController extends BaseController {
    @Get('')
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<TimeSlotDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const slots = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
            order: { start_time: 'ASC' },
        });

        return (slots as TimeSlot[]).map(toTimeSlotDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async create(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: TimeSlotCreateDto }) data: TimeSlotCreateDto,
    ): Promise<TimeSlotDto> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        if (data.start_time >= data.end_time) {
            throw new BadRequestError('start_time must be before end_time');
        }

        if (
            await hasOverlap(
                this.repository,
                restaurantId,
                data.start_time,
                data.end_time,
            )
        ) {
            throw new ConflictError(
                'Time slot overlaps with an existing one for this restaurant',
            );
        }

        try {
            const slot = this.repository.create({
                ...data,
                restaurant_id: Number(restaurantId),
            });
            await this.repository.save(slot);

            return toTimeSlotDto(slot as TimeSlot);
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictError(
                    'A time slot with this start_time already exists for this restaurant',
                );
            }

            throw error;
        }
    }

    @Patch('/:timeSlotId')
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async update(
        @Param('restaurantId') restaurantId: number,
        @Param('timeSlotId') timeSlotId: number,
        @Body({ type: TimeSlotUpdateDto }) data: TimeSlotUpdateDto,
    ): Promise<TimeSlotDto> {
        const slot = await this.repository.findOneBy({
            id: timeSlotId,
            restaurant_id: Number(restaurantId),
        });

        if (!slot) {
            throw new NotFoundError('Time slot not found');
        }

        const startTime = data.start_time ?? (slot as TimeSlot).start_time;
        const endTime = data.end_time ?? (slot as TimeSlot).end_time;

        if (startTime >= endTime) {
            throw new BadRequestError('start_time must be before end_time');
        }

        if (
            await hasOverlap(
                this.repository,
                restaurantId,
                startTime,
                endTime,
                timeSlotId,
            )
        ) {
            throw new ConflictError(
                'Time slot overlaps with an existing one for this restaurant',
            );
        }

        Object.assign(slot as TimeSlot, data);

        try {
            await this.repository.save(slot as TimeSlot);

            return toTimeSlotDto(slot as TimeSlot);
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictError(
                    'A time slot with this start_time already exists for this restaurant',
                );
            }

            throw error;
        }
    }

    @Delete('/:timeSlotId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    async remove(
        @Param('restaurantId') restaurantId: number,
        @Param('timeSlotId') timeSlotId: number,
    ): Promise<void> {
        const slot = await this.repository.findOneBy({
            id: timeSlotId,
            restaurant_id: Number(restaurantId),
        });

        if (!slot) {
            throw new NotFoundError('Time slot not found');
        }

        const { exists } = await bookingsExist({ timeSlotIds: [Number(timeSlotId)] });
        if (exists) {
            throw new ConflictError(
                'Time slot has bookings, disable it instead (is_active = false)',
            );
        }

        await this.repository.remove(slot);
    }
}

export default TimeSlotController;
