import {
    Get,
    Post,
    Patch,
    Param,
    Body,
    Req,
    QueryParams,
    UseBefore,
    HttpCode,
    NotFoundError,
    ForbiddenError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Booking } from '../models/booking.entity';
import { Role } from '../models/enums/role.enum';
import { BookingStatus } from '../models/enums/booking-status.enum';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';
import { getManagedRestaurants } from '../clients/restaurants-client';
import { createBooking, canTransition } from '../services/booking.service';
import { buildContextMaps } from '../services/booking-enrichment.service';

import {
    BookingCreateDto,
    BookingStatusUpdateDto,
    BookingListQueryDto,
    BookingDto,
    BookingDetailsDto,
    BookingPageDto,
    toBookingDto,
    toBookingDetailsDto,
} from '../dto/booking.dto';
import { ConflictError } from '../errors/http-errors';
import { getSkipTake, buildPageMeta } from '../utils/pagination';

// Адаптация лр1/src/controllers/booking.controller.ts: там, где раньше были
// leftJoinAndSelect/relations на RestaurantTable/TimeSlot/User в одной БД, теперь
// либо локальный столбец restaurant_id (раздел 9), либо батч-вызов restaurants
// (см. services/booking-enrichment.service.ts).
@EntityController({
    baseRoute: '/bookings',
    entity: Booking,
})
class BookingController extends BaseController {
    // POST /bookings — любой авторизованный пользователь бронирует себе
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: BookingCreateDto }) data: BookingCreateDto,
    ): Promise<BookingDto> {
        const booking = await createBooking(request.user.id, data);

        return toBookingDto(booking);
    }

    // GET /bookings — ADMIN видит все, RESTAURANT_ADMIN — только брони своих ресторанов
    @Get('')
    @UseBefore(authMiddleware, requireRole(Role.ADMIN, Role.RESTAURANT_ADMIN))
    async list(
        @Req() request: RequestWithUser,
        @QueryParams({ type: BookingListQueryDto }) query: BookingListQueryDto,
    ): Promise<BookingPageDto> {
        const qb = this.repository.createQueryBuilder('booking');

        if (request.user.role === Role.RESTAURANT_ADMIN) {
            const restaurantIds = await getManagedRestaurants(request.user.id);

            if (restaurantIds.length === 0) {
                return {
                    items: [],
                    meta: buildPageMeta(0, query.page, query.limit),
                };
            }

            qb.andWhere('booking.restaurant_id IN (:...restaurantIds)', {
                restaurantIds,
            });
        }

        if (query.restaurant_id !== undefined) {
            qb.andWhere('booking.restaurant_id = :restaurantId', {
                restaurantId: query.restaurant_id,
            });
        }
        if (query.date) {
            qb.andWhere('booking.booking_date = :date', { date: query.date });
        }
        if (query.status) {
            qb.andWhere('booking.status = :status', { status: query.status });
        }

        qb.orderBy('booking.created_at', 'DESC');

        const { skip, take } = getSkipTake(query.page, query.limit);
        qb.skip(skip).take(take);

        const [items, total] = await qb.getManyAndCount();
        const bookings = items as Booking[];

        const context = await buildContextMaps(bookings);

        return {
            items: bookings.map((booking) =>
                toBookingDetailsDto(booking, context.restaurants, context.tables, context.timeSlots),
            ),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }

    // GET /bookings/{bookingId} — владелец, администратор её ресторана или ADMIN
    @Get('/:bookingId')
    @UseBefore(authMiddleware)
    async getOne(
        @Req() request: RequestWithUser,
        @Param('bookingId') bookingId: number,
    ): Promise<BookingDetailsDto> {
        const booking = await this.repository.findOneBy({ id: Number(bookingId) });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        const typedBooking = booking as Booking;
        await this.assertCanAccess(request.user, typedBooking);

        const context = await buildContextMaps([typedBooking]);

        return toBookingDetailsDto(typedBooking, context.restaurants, context.tables, context.timeSlots);
    }

    // PATCH /bookings/{bookingId}/status
    @Patch('/:bookingId/status')
    @UseBefore(authMiddleware)
    async updateStatus(
        @Req() request: RequestWithUser,
        @Param('bookingId') bookingId: number,
        @Body({ type: BookingStatusUpdateDto }) data: BookingStatusUpdateDto,
    ): Promise<BookingDto> {
        const booking = await this.repository.findOneBy({ id: Number(bookingId) });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        const typedBooking = booking as Booking;
        const isStaff = await this.assertCanAccess(request.user, typedBooking);

        if (!isStaff && data.status !== BookingStatus.CANCELLED) {
            throw new ForbiddenError('Users can only cancel their own booking');
        }

        if (!canTransition(typedBooking.status, data.status)) {
            throw new ConflictError(
                `Cannot transition booking from ${typedBooking.status} to ${data.status}`,
            );
        }

        typedBooking.status = data.status;
        await this.repository.save(typedBooking);

        return toBookingDto(typedBooking);
    }

    // Владелец, ADMIN или администратор ресторана этой брони (через эндпоинт 6, раздел 10).
    // Возвращает true, если пользователь — "персонал" (ADMIN/администратор ресторана).
    private async assertCanAccess(
        user: { id: number; role: Role },
        booking: Booking,
    ): Promise<boolean> {
        const isOwner = booking.user_id === user.id;
        const isAdmin = user.role === Role.ADMIN;

        let isRestaurantStaff = false;
        if (user.role === Role.RESTAURANT_ADMIN) {
            const restaurantIds = await getManagedRestaurants(user.id);
            isRestaurantStaff = restaurantIds.includes(booking.restaurant_id);
        }

        if (!isOwner && !isAdmin && !isRestaurantStaff) {
            throw new ForbiddenError('Insufficient permissions');
        }

        return isAdmin || isRestaurantStaff;
    }
}

export default BookingController;
