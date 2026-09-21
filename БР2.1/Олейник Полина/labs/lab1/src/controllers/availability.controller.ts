import { Get, Param, QueryParams, NotFoundError, BadRequestError } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import dataSource from '../config/data-source';

import { Restaurant } from '../models/restaurant.entity';
import { TimeSlot } from '../models/time-slot.entity';

import { AvailabilityQueryDto, AvailabilityDto } from '../dto/availability.dto';
import { toTimeSlotDto } from '../dto/time-slot.dto';
import { toRestaurantTableDto } from '../dto/restaurant-table.dto';
import { ErrorDto } from '../dto/error.dto';

import { getAvailableTables } from '../services/availability.service';

// сегодняшняя дата в формате "ГГГГ-ММ-ДД" — строки в этом формате можно сравнивать
// просто как строки (< и >), не превращая в объект Date
function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// Этот контроллер не привязан ни к одной модели (нет entity в @EntityController) —
// он не хранит данные сам, а только ищет свободные столики через
// services/availability.service.ts. Поэтому и не наследует BaseController —
// поле this.repository ему просто не нужно.
@EntityController({
    baseRoute: '/restaurants/:restaurantId/availability',
})
class AvailabilityController {
    // GET /restaurants/{restaurantId}/availability?date=...&time_slot_id=...&guests_count=...
    @Get('')
    @OpenAPI({ summary: 'Свободные столики на дату и слот' })
    @ResponseSchema(AvailabilityDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 400 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async get(
        @Param('restaurantId') restaurantIdParam: number,
        @QueryParams({ type: AvailabilityQueryDto }) query: AvailabilityQueryDto,
    ): Promise<AvailabilityDto> {
        const restaurantId = Number(restaurantIdParam); // параметр из URL приходит строкой — приводим к числу

        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        // проверяем, что такой слот вообще существует и принадлежит именно этому ресторану
        const timeSlot = await dataSource.getRepository(TimeSlot).findOneBy({
            id: query.time_slot_id,
            restaurant_id: restaurantId,
        });
        if (!timeSlot) {
            throw new NotFoundError('Time slot not found for this restaurant');
        }

        if (query.date < today()) {
            throw new BadRequestError('date must not be in the past');
        }

        // вся логика поиска свободных столиков вынесена в отдельный сервис —
        // контроллер только проверяет входные данные и вызывает его
        const tables = await getAvailableTables(
            restaurantId,
            query.time_slot_id,
            query.date,
            query.guests_count,
        );

        return {
            date: query.date,
            time_slot: toTimeSlotDto(timeSlot),
            tables: tables.map(toRestaurantTableDto),
        };
    }
}

export default AvailabilityController;
