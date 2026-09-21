import { IsInt, IsDateString, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../models/enums/booking-status.enum';
import { PaginationQueryDto, PageMetaDto } from './pagination.dto';
import { RestaurantShortDto, toRestaurantShortDto } from './restaurant.dto';
import { RestaurantTableDto, toRestaurantTableDto } from './restaurant-table.dto';
import { TimeSlotDto, toTimeSlotDto } from './time-slot.dto';

// Тело запроса POST /bookings — создание брони
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

// Тело запроса PATCH /bookings/{id}/status — на какой статус переключить
class BookingStatusUpdateDto {
    @IsEnum(BookingStatus)
    status: BookingStatus;
}

// Query-параметры GET /bookings и GET /users/me/bookings — фильтры списка
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

// Короткая форма брони — без вложенных данных о ресторане/столике/слоте
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

// Полная форма брони — с данными ресторана, столика и слота, для списков и истории
class BookingDetailsDto extends BookingDto {
    restaurant: RestaurantShortDto;
    restaurant_table: RestaurantTableDto;
    time_slot: TimeSlotDto;
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

// Требует, чтобы у booking были заранее подгружены связи
// restaurant_table, restaurant_table.restaurant и time_slot (relations в контроллере)
function toBookingDetailsDto(booking: Booking): BookingDetailsDto {
    return {
        ...toBookingDto(booking),
        restaurant: toRestaurantShortDto(booking.restaurant_table.restaurant),
        restaurant_table: toRestaurantTableDto(booking.restaurant_table),
        time_slot: toTimeSlotDto(booking.time_slot),
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
