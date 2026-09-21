import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { TimeSlotDto } from './time-slot.dto';
import { RestaurantTableDto } from './restaurant-table.dto';

// Query-параметры GET /restaurants/{id}/availability — что искать: дата, слот, число гостей
class AvailabilityQueryDto {
    @IsDateString() // проверяет формат даты "2026-10-05"
    @Type(() => String)
    date: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    time_slot_id: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    guests_count: number;
}

// Форма ответа: сама дата, слот и список свободных столиков
class AvailabilityDto {
    date: string;
    time_slot: TimeSlotDto;
    tables: RestaurantTableDto[];
}

export { AvailabilityQueryDto, AvailabilityDto };
