import { JsonController, Get, Req, QueryParams, UseBefore } from 'routing-controllers';

import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { buildContextMaps } from '../services/booking-enrichment.service';

import {
    BookingListQueryDto,
    BookingPageDto,
    toBookingDetailsDto,
} from '../dto/booking.dto';
import { getSkipTake, buildPageMeta } from '../utils/pagination';

// GET /users/me/bookings (раздел 5 CLAUDE.md — операция bookings-service, не auth).
// Единственное место деградации при сбое restaurants (раздел 10, сценарий 3):
// buildContextMaps вызывается с safe:true — при сбое поля restaurant/restaurant_table/
// time_slot будут null, но запрос всё равно вернёт 200.
@JsonController()
class MyBookingsController {
    @Get('/users/me/bookings')
    @UseBefore(authMiddleware)
    async getMyBookings(
        @Req() request: RequestWithUser,
        @QueryParams({ type: BookingListQueryDto }) query: BookingListQueryDto,
    ): Promise<BookingPageDto> {
        const { skip, take } = getSkipTake(query.page, query.limit);

        const qb = dataSource
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .where('booking.user_id = :userId', { userId: request.user.id });

        if (query.status) {
            qb.andWhere('booking.status = :status', { status: query.status });
        }

        qb.orderBy('booking.created_at', 'DESC').skip(skip).take(take);

        const [items, total] = await qb.getManyAndCount();
        const bookings = items as Booking[];

        const context = await buildContextMaps(bookings, { safe: true });

        return {
            items: bookings.map((booking) =>
                toBookingDetailsDto(booking, context.restaurants, context.tables, context.timeSlots),
            ),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }
}

export default MyBookingsController;
