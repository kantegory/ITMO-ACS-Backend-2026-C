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
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

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
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation, isUniqueViolation } from '../utils/db-errors';

// Проверяет, пересекается ли интервал [startTime, endTime) с уже существующими
// слотами этого ресторана. excludeId нужен при обновлении слота — чтобы слот
// не "пересекался сам с собой". Это проверка на уровне кода — в базе такое
// ограничение (exclusion constraint по диапазонам) делать было бы избыточно для лабы.
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
        // два интервала пересекаются, если начало одного раньше конца другого и наоборот
        .andWhere('slot.start_time < :end', { end: endTime })
        .andWhere('slot.end_time > :start', { start: startTime });

    if (excludeId !== undefined) {
        qb.andWhere('slot.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();

    return count > 0;
}

// Временные слоты ресторана: список открыт всем, изменения — ADMIN
// или администратор этого ресторана.
@EntityController({
    baseRoute: '/restaurants/:restaurantId/time-slots',
    entity: TimeSlot,
})
class TimeSlotController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Временные слоты ресторана' })
    @ResponseSchema(TimeSlotDto, { isArray: true, statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<TimeSlotDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        // Number(restaurantId): значение из URL приходит строкой — приводим явно к числу
        const slots = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
            order: { start_time: 'ASC' },
        });

        return (slots as TimeSlot[]).map(toTimeSlotDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Добавить слот' })
    @ResponseSchema(TimeSlotDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        // на всякий случай проверяем ещё раз в коде, хотя это же ограничение есть и в базе (@Check)
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
            // на случай если два запроса создали слот с одинаковым началом одновременно —
            // проверка выше её могла не поймать, а @Unique в базе поймает точно
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
    @OpenAPI({ summary: 'Изменить слот' })
    @ResponseSchema(TimeSlotDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        // ?? — берём новое значение, если его прислали, иначе оставляем текущее из базы
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
                timeSlotId, // исключаем сам этот слот из проверки на пересечение
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
    @OpenAPI({ summary: 'Удалить слот' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
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

        try {
            await this.repository.remove(slot);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new ConflictError(
                    'Time slot has bookings, disable it instead (is_active = false)',
                );
            }

            throw error;
        }
    }
}

export default TimeSlotController;
