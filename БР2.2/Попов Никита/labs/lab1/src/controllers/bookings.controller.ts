import "reflect-metadata";
import {
    Get,
    Post,
    Patch,
    Param,
    QueryParams,
    Body,
    UseBefore,
    Req,
    JsonController,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import dataSource from '../config/data-source';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { ApiErrorDto } from '../common/api-errors';
import { Booking, BookingStatus } from '../models/booking.entity';

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

class ListRestaurantBookingsQuery extends PaginationQuery {
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @IsOptional()
    @IsString()
    dateTo?: string;

    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;
}

class CreateBookingDto {
    @IsString()
    fromDate: string;

    @IsString()
    toDate: string;

    @IsInt()
    @Type(() => Number)
    guestCount: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

class UpdateBookingStatusDto {
    @IsEnum(BookingStatus)
    status: BookingStatus;
}

class PaginatedBookingsDto {
    @Type(() => Booking)
    items: Booking[];

    total: number;
    page: number;
    pageSize: number;
}

class ListBookingsResponseDto {
    data: PaginatedBookingsDto;
}

class BookingResponseDto {
    @Type(() => Booking)
    data: Booking;
}

@JsonController()
export class BookingsController {
    private bookingRepo = dataSource.getRepository(Booking);

    @Get('/bookings/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Получение списка бронирований текущего пользователя' })
    @ResponseSchema(ListBookingsResponseDto, { statusCode: 200 })
    async myBookings(
        @Req() request: RequestWithUser,
        @QueryParams({ type: PaginationQuery }) query: PaginationQuery,
    ): Promise<ListBookingsResponseDto> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;

        const { user } = request;

        const [items, total] = await this.bookingRepo.findAndCount({
            where: { userId: user.id },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            data: {
                items,
                total,
                page,
                pageSize,
            },
        };
    }

    @Get('/restaurants/:restaurantId/bookings')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Получение списка бронирований ресторана по его id' })
    @ResponseSchema(ListBookingsResponseDto, { statusCode: 200 })
    async listRestaurantBookings(
        @Param('restaurantId') restaurantId: string,
        @QueryParams({ type: ListRestaurantBookingsQuery }) query: ListRestaurantBookingsQuery,
    ): Promise<ListBookingsResponseDto> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;

        const where: any = { restaurantId };

        if (query.status) {
            where.status = query.status;
        }

        if (query.dateFrom && query.dateTo) {
            where.fromDate = Between(
                new Date(query.dateFrom),
                new Date(query.dateTo),
            );
        } else if (query.dateFrom) {
            where.fromDate = MoreThanOrEqual(new Date(query.dateFrom));
        } else if (query.dateTo) {
            where.fromDate = LessThanOrEqual(new Date(query.dateTo));
        }

        const [items, total] = await this.bookingRepo.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            data: {
                items,
                total,
                page,
                pageSize,
            },
        };
    }

    @Post('/restaurants/:restaurantId/bookings')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создания бронирования' })
    @ResponseSchema(BookingResponseDto, { statusCode: 200 })
    async createBooking(
        @Param('restaurantId') restaurantId: string,
        @Req() request: RequestWithUser,
        @Body({ type: CreateBookingDto }) body: CreateBookingDto,
    ): Promise<BookingResponseDto> {
        const { user } = request;

        const booking = this.bookingRepo.create({
            restaurantId,
            userId: user.id,
            fromDate: new Date(body.fromDate),
            toDate: new Date(body.toDate),
            guestCount: body.guestCount,
            comment: body.comment,
            status: BookingStatus.CONFIRMED,
        });

        const saved = await this.bookingRepo.save(booking);

        return { data: saved };
    }

    @Patch('/bookings/:id/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновление статуса бронирования' })
    @ResponseSchema(BookingResponseDto, { statusCode: 200 })
    @ResponseSchema(ApiErrorDto, { statusCode: 404 })
    async updateStatus(
        @Param('id') id: string,
        @Body({ type: UpdateBookingStatusDto }) body: UpdateBookingStatusDto,
    ): Promise<BookingResponseDto | { code: string; message: string }> {
        const booking = await this.bookingRepo.findOneBy({ id });
        if (!booking) {
            return { code: 'NOT_FOUND', message: 'Booking not found' };
        }

        booking.status = body.status;
        const saved = await this.bookingRepo.save(booking);

        return { data: saved };
    }
}

