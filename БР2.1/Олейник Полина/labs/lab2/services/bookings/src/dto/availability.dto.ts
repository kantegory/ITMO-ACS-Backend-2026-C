import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { TableInternal, TimeSlotInternal } from '../clients/restaurants-client';

// Адаптация лр1/src/dto/availability.dto.ts — та же форма, только time_slot/tables
// приходят из restaurants-client, а не из локальных сущностей.
class AvailabilityQueryDto {
    @IsDateString()
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

class AvailabilityDto {
    date: string;
    time_slot: TimeSlotInternal;
    tables: TableInternal[];
}

export { AvailabilityQueryDto, AvailabilityDto };
