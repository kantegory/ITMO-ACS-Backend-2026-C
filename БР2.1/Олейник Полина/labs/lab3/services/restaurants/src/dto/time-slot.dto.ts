import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';

import { TimeSlot } from '../models/time-slot.entity';
import { formatTime } from '../utils/time-format';

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

// Копия лр1/src/dto/time-slot.dto.ts.
class TimeSlotCreateDto {
    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    start_time: string;

    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    end_time: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_active?: boolean = true;
}

class TimeSlotUpdateDto {
    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    start_time?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN)
    @Type(() => String)
    end_time?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_active?: boolean;
}

class TimeSlotDto {
    id: number;
    restaurant_id: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

function toTimeSlotDto(slot: TimeSlot): TimeSlotDto {
    return {
        id: slot.id,
        restaurant_id: slot.restaurant_id,
        start_time: formatTime(slot.start_time),
        end_time: formatTime(slot.end_time),
        is_active: slot.is_active,
    };
}

export { TimeSlotCreateDto, TimeSlotUpdateDto, TimeSlotDto, toTimeSlotDto };
