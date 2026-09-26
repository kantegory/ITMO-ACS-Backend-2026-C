import { IsInt, IsDateString, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';
import { PaginationQueryDto, PageMetaDto } from './pagination.dto';
import { TableInternal, TimeSlotInternal, RestaurantShort } from '../clients/restaurants-client';

// Адаптация лр1/src/dto/booking.dto.ts: restaurant/restaurant_table/time_slot
// в BookingDetailsDto раньше подгружались TypeORM-связями, теперь собираются из
// ответа getBookingContext (см. controllers/booking.controller.ts) — и поэтому
// nullable: обращение к restaurants может быть недоступно (раздел 10, сценарий 3).
class BookingCreateDto {
    @IsInt()
    @Type(() => Number)
    restaurant_table_id: number;

    @IsInt()
    @Type(() => Number)
    time_slot_id: number;

    @IsDateString()
    @Type(() => String)
    booking_date: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    guests_count: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

class BookingStatusUpdateDto {
    @IsEnum(BookingStatus)
    status: BookingStatus;
}

class BookingListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    restaurant_id?: number;

    @IsOptional()
    @IsDateString()
    @Type(() => String)
    date?: string;

    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;
}

class BookingDto {
    id: number;
    user_id: number;
    restaurant_table_id: number;
    time_slot_id: number;
    status: BookingStatus;
    booking_date: string;
    guests_count: number;
    comment: string | null;
    created_at: Date;
    updated_at: Date;
}

class BookingDetailsDto extends BookingDto {
    restaurant: RestaurantShort | null;
    restaurant_table: TableInternal | null;
    time_slot: TimeSlotInternal | null;
}

class BookingPageDto {
    items: BookingDetailsDto[];
    meta: PageMetaDto;
}

function toBookingDto(booking: Booking): BookingDto {
    return {
        id: booking.id,
        user_id: booking.user_id,
        restaurant_table_id: booking.restaurant_table_id,
        time_slot_id: booking.time_slot_id,
        status: booking.status,
        booking_date: booking.booking_date,
        guests_count: booking.guests_count,
        comment: booking.comment,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
    };
}

// context* — карты id->данные, собранные одним батч-вызовом getBookingContext
// на всю страницу (см. controllers). Отсутствие записи (сбой restaurants или
// id не найден) -> соответствующее поле null.
function toBookingDetailsDto(
    booking: Booking,
    contextRestaurants: Map<number, RestaurantShort>,
    contextTables: Map<number, TableInternal>,
    contextTimeSlots: Map<number, TimeSlotInternal>,
): BookingDetailsDto {
    return {
        ...toBookingDto(booking),
        restaurant: contextRestaurants.get(booking.restaurant_id) ?? null,
        restaurant_table: contextTables.get(booking.restaurant_table_id) ?? null,
        time_slot: contextTimeSlots.get(booking.time_slot_id) ?? null,
    };
}

export {
    BookingCreateDto,
    BookingStatusUpdateDto,
    BookingListQueryDto,
    BookingDto,
    BookingDetailsDto,
    BookingPageDto,
    toBookingDto,
    toBookingDetailsDto,
};
